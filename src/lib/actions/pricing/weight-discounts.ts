/**
 * Weight Discount System for Qwik City
 * HIGH RISK: Sequential discount calculations - order matters!
 * Migrated from Next.js server actions
 */

import { db } from '~/lib/db';
import {
    fruitTypes,
    pricingRules,
    discountThresholds,
    qualityEvaluations,
    weightDiscountCalculations,
    desgloseDescuentos
} from '~/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
    calculateWeightDiscounts,
    validateWeightDiscountInputs,
    createDiscountBreakdownForStorage
} from '~/lib/utils/pricing';
import type {
    WeightDiscountRequest,
    WeightDiscountResponse,
    WeightDiscountCalculation,
    AdminDiscountOverrideRequest,
} from '~/lib/actions/types';

/**
 * Calculate weight discounts for a reception
 * CRITICAL: Discounts are sequential - Moho → Humedad → Violetas
 * 
 * @param data - Weight discount request data
 * @param userId - ID of the user (for response data)
 * @returns Weight discount calculation result
 */
export async function calculateWeightDiscountsUtil(
    data: WeightDiscountRequest,
    userId: string,
): Promise<WeightDiscountResponse> {
    try {
        console.log('⚖️ calculateWeightDiscounts called with:', data);

        // Get fruit type name from ID
        const fruitTypeData = await db
            .select({ type: fruitTypes.type })
            .from(fruitTypes)
            .where(eq(fruitTypes.id, data.fruit_type_id))
            .limit(1);

        if (fruitTypeData.length === 0) {
            return { success: false, error: 'Error al obtener el tipo de fruta' };
        }

        const fruitType = fruitTypeData[0];

        // Get discount thresholds for the fruit type
        const thresholdsData = await db
            .select()
            .from(discountThresholds)
            .innerJoin(pricingRules, eq(discountThresholds.pricingRuleId, pricingRules.id))
            .where(and(
                eq(pricingRules.fruitType, fruitType.type),
                eq(pricingRules.qualityBasedPricingEnabled, true)
            ));

        if (thresholdsData.length === 0) {
            return {
                success: false,
                error: 'No hay umbrales de descuento configurados para este tipo de fruta',
            };
        }

        // Transform thresholds to expected format
        const thresholds = thresholdsData.map(row => ({
            id: row.discount_thresholds.id,
            pricing_rule_id: row.discount_thresholds.pricingRuleId,
            quality_metric: row.discount_thresholds.qualityMetric as 'Violetas' | 'Humedad' | 'Moho',
            limit_value: Number(row.discount_thresholds.limitValue),
            created_at: row.discount_thresholds.createdAt?.toISOString() || '',
            updated_at: row.discount_thresholds.updatedAt?.toISOString() || '',
            created_by: row.discount_thresholds.createdBy || undefined,
            updated_by: row.discount_thresholds.updatedBy || undefined,
        }));

        // Validate calculation inputs
        const validationInputs = validateWeightDiscountInputs(
            data.total_weight,
            data.quality_data,
            thresholds,
        );

        if (!validationInputs.isValid) {
            return {
                success: false,
                error: 'Datos inválidos para cálculo',
                details: validationInputs.errors,
            };
        }

        // CRITICAL: Calculate weight discounts sequentially
        // Order: Moho → Humedad → Violetas
        // Each discount applies to CURRENT weight, not original
        const calculationResult = calculateWeightDiscounts(
            data.total_weight,
            data.quality_data,
            thresholds,
        );

        // Create response data structure
        const responseData: WeightDiscountCalculation = {
            reception_id: data.reception_id,
            total_peso_original: calculationResult.original_weight,
            total_peso_descuento: calculationResult.total_discount,
            total_peso_final: calculationResult.final_weight,
            breakdown: calculationResult.breakdowns.map((breakdown) => ({
                parametro: breakdown.parametro,
                umbral: breakdown.umbral,
                valor: breakdown.valor,
                porcentaje_descuento: breakdown.porcentaje_descuento,
                peso_descuento: breakdown.peso_descuento,
            })),
            calculation_timestamp: new Date().toISOString(),
            calculated_by: userId,
        };

        console.log('✅ Weight discount calculation successful:', {
            original: responseData.total_peso_original,
            discount: responseData.total_peso_descuento,
            final: responseData.total_peso_final,
        });

        return { success: true, data: responseData };
    } catch (error) {
        console.error('❌ Unexpected error in weight discount calculation:', error);
        return {
            success: false,
            error: 'Error inesperado al calcular descuentos de peso',
        };
    }
}

/**
 * Save weight discount calculation for a reception
 * Saves to quality_evaluations and logs the calculation
 * 
 * @param data - Weight discount request data
 * @param userId - ID of the user making the save
 * @returns Success status with calculation ID
 */
export async function saveWeightDiscountCalculationUtil(
    data: WeightDiscountRequest,
    userId: string,
): Promise<{ success: boolean; error?: string; calculationId?: string }> {
    console.log('💾 saveWeightDiscountCalculation called');

    try {
        // Save quality evaluation data
        console.log('💾 Saving quality evaluation data...');
        await db
            .insert(qualityEvaluations)
            .values({
                recepcionId: data.reception_id,
                violetas: data.quality_data.violetas?.toString(),
                humedad: data.quality_data.humedad?.toString(),
                moho: data.quality_data.moho?.toString(),
                createdBy: userId,
                updatedBy: userId,
            })
            .onConflictDoUpdate({
                target: qualityEvaluations.recepcionId,
                set: {
                    violetas: data.quality_data.violetas?.toString(),
                    humedad: data.quality_data.humedad?.toString(),
                    moho: data.quality_data.moho?.toString(),
                    updatedBy: userId,
                    updatedAt: new Date(),
                },
            });

        console.log('✅ Quality evaluation saved successfully');

        // Calculate discounts
        const calculationResult = await calculateWeightDiscountsUtil(data, userId);

        if (!calculationResult.success || !calculationResult.data) {
            return {
                success: false,
                error: calculationResult.error || 'Error en cálculo de descuentos',
            };
        }

        // Log calculation for audit trail
        try {
            await db
                .insert(weightDiscountCalculations)
                .values({
                    receptionId: data.reception_id,
                    calculationData: calculationResult.data,
                    createdBy: userId,
                });

            console.log('✅ Weight discount calculation logged successfully');
        } catch (logError: any) {
            console.warn(
                '⚠️ Could not log weight discount calculation:',
                logError.message,
            );
            // Don't fail the operation if logging fails
        }

        // Save discount breakdown
        const breakdownData = createDiscountBreakdownForStorage(
            {
                original_weight: calculationResult.data.total_peso_original,
                total_discount: calculationResult.data.total_peso_descuento,
                final_weight: calculationResult.data.total_peso_final,
                breakdowns: calculationResult.data.breakdown,
            },
            data.reception_id,
            userId
        );

        if (breakdownData.length > 0) {
            try {
                await db.insert(desgloseDescuentos).values(breakdownData);
                console.log('✅ Discount breakdown saved');
            } catch (breakdownError: any) {
                console.warn('⚠️ Could not save breakdown:', breakdownError.message);
            }
        }

        return { success: true, calculationId: data.reception_id };
    } catch (error) {
        console.error('❌ Unexpected error saving weight discount calculation:', error);
        return {
            success: false,
            error: 'Error inesperado al guardar cálculo de descuentos',
        };
    }
}

/**
 * Get discount breakdown for a reception
 * Retrieves the saved discount details from the database
 * 
 * @param receptionId - UUID of the reception
 * @returns Discount breakdown data or error
 */
export async function getDiscountBreakdownUtil(
    receptionId: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('📊 Getting discount breakdown for:', receptionId);

        // Get discount breakdown from database
        const breakdowns = await db
            .select()
            .from(desgloseDescuentos)
            .where(eq(desgloseDescuentos.recepcionId, receptionId));

        if (breakdowns.length === 0) {
            console.log('No discount breakdown found');
            return { success: true, data: [] };
        }

        const formattedBreakdowns = breakdowns.map(b => ({
            id: b.id,
            recepcion_id: b.recepcionId,
            parametro: b.parametro,
            umbral: b.umbral,
            valor: b.valor,
            porcentaje_descuento: b.porcentajeDescuento,
            peso_descuento: parseFloat(b.pesoDescuento.toString()),
            created_by: b.createdBy,
            created_at: b.createdAt?.toISOString(),
        }));

        console.log(`✅ Found ${formattedBreakdowns.length} breakdown items`);
        return { success: true, data: formattedBreakdowns };
    } catch (error) {
        console.error('❌ Error getting discount breakdown:', error);
        return {
            success: false,
            error: 'Error al obtener el desglose de descuentos',
        };
    }
}

/**
 * Admin override for weight discounts
 * Allows admin to manually set custom discount values
 * 
 * @param data - Admin override request
 * @param userId - ID of the admin user
 * @returns Override result
 */
export async function adminOverrideWeightDiscountsUtil(
    data: AdminDiscountOverrideRequest,
    userId: string,
): Promise<WeightDiscountResponse> {
    try {
        console.log('🔐 Admin override weight discounts:', data);

        // Validate the override data
        const finalWeightCheck = data.total_peso_original - data.total_peso_descuento;
        if (Math.abs(finalWeightCheck - data.total_peso_final) > 0.01) {
            return {
                success: false,
                error: 'Los valores no cuadran: original - descuento debe ser igual a final',
            };
        }

        // Create override calculation record
        const overrideData: WeightDiscountCalculation = {
            reception_id: data.reception_id,
            total_peso_original: data.total_peso_original,
            total_peso_descuento: data.total_peso_descuento,
            total_peso_final: data.total_peso_final,
            breakdown: data.breakdown || [],
            calculation_timestamp: new Date().toISOString(),
            calculated_by: userId,
        };

        // Log the override
        try {
            await db.insert(weightDiscountCalculations).values({
                receptionId: data.reception_id,
                calculationData: {
                    ...overrideData,
                    override: true,
                    override_reason: data.override_reason,
                },
                createdBy: userId,
            });
            console.log('✅ Admin override logged');
        } catch (logError: any) {
            console.warn('⚠️ Could not log admin override:', logError.message);
        }

        // Save breakdown if provided
        if (data.breakdown && data.breakdown.length > 0) {
            const breakdownData = createDiscountBreakdownForStorage(
                {
                    original_weight: data.total_peso_original,
                    total_discount: data.total_peso_descuento,
                    final_weight: data.total_peso_final,
                    breakdowns: data.breakdown,
                },
                data.reception_id,
                userId
            );

            try {
                // Delete existing breakdown
                await db.delete(desgloseDescuentos).where(eq(desgloseDescuentos.recepcionId, data.reception_id));
                // Insert new breakdown
                await db.insert(desgloseDescuentos).values(breakdownData);
                console.log('✅ Override breakdown saved');
            } catch (breakdownError: any) {
                console.warn('⚠️ Could not save override breakdown:', breakdownError.message);
            }
        }

        return { success: true, data: overrideData };
    } catch (error) {
        console.error('❌ Error in admin override:', error);
        return {
            success: false,
            error: 'Error al aplicar anulación administrativa',
        };
    }
}
