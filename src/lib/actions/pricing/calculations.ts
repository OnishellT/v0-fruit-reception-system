/**
 * Pricing Calculations for Qwik City
 * HIGH RISK: Financial calculations - must match Next.js exactly
 * Migrated from Next.js server actions
 */

import { db } from '~/lib/db';
import { fruitTypes, pricingRules, discountThresholds, pricingCalculations } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getDailyPrice } from './daily-prices';
import {
    calculatePricing,
    calculateWeightDiscounts,
    validatePricingCalculation
} from '~/lib/utils/pricing';
import type {
    CalculateReceptionPricingData,
    PricingCalculationPreviewResponse,
    SaveReceptionWithPricingData,
} from '~/lib/actions/types';

/**
 * Calculate reception pricing (preview without saving)
 * This previews the final price after quality discounts
 * 
 * CRITICAL: This function calculates money - accuracy is paramount!
 * 
 * @param data - Reception pricing data
 * @returns Preview of pricing calculation or validation errors
 */
export async function calculateReceptionPricingUtil(
    data: CalculateReceptionPricingData,
): Promise<PricingCalculationPreviewResponse> {
    try {
        console.log('💰 calculateReceptionPricing called with:', data);

        // Get fruit type ID from fruit type name
        const fruitTypeResult = await db
            .select({ id: fruitTypes.id })
            .from(fruitTypes)
            .where(eq(fruitTypes.type, data.fruit_type))
            .limit(1);

        if (fruitTypeResult.length === 0) {
            return {
                can_calculate: false,
                errors: ['Tipo de fruta no encontrado'],
            };
        }

        const fruitTypeId = fruitTypeResult[0].id;

        // Get daily price for today (or use provided date if available)
        const today = new Date().toISOString().split('T')[0];
        const dailyPrice = await getDailyPrice(fruitTypeId, today);

        if (!dailyPrice) {
            return {
                can_calculate: false,
                errors: ['No hay precio diario disponible para este tipo de fruta en la fecha seleccionada'],
            };
        }

        // Get quality thresholds for discount calculation
        const thresholdsData = await db
            .select({
                threshold: discountThresholds,
                pricingRule: pricingRules,
            })
            .from(discountThresholds)
            .innerJoin(pricingRules, eq(discountThresholds.pricingRuleId, pricingRules.id))
            .where(eq(pricingRules.fruitType, data.fruit_type));

        if (thresholdsData.length === 0) {
            return {
                can_calculate: false,
                errors: ['No hay reglas de precios configuradas para este tipo de fruta'],
            };
        }

        const pricingRule = thresholdsData[0].pricingRule;

        // Transform thresholds to expected format
        const thresholds = thresholdsData.map(item => ({
            id: item.threshold.id,
            pricing_rule_id: item.threshold.pricingRuleId,
            quality_metric: item.threshold.qualityMetric as 'Violetas' | 'Humedad' | 'Moho',
            limit_value: Number(item.threshold.limitValue),
            created_at: item.threshold.createdAt?.toISOString() || '',
            updated_at: item.threshold.updatedAt?.toISOString() || '',
            created_by: item.threshold.createdBy || undefined,
            updated_by: item.threshold.updatedBy || undefined,
        }));

        // Use the provided quality_evaluation
        const combinedQualityMetrics = data.quality_evaluation;

        // Validate calculation
        const validationResult = validatePricingCalculation(
            data.fruit_type,
            combinedQualityMetrics,
            thresholds,
            pricingRule.qualityBasedPricingEnabled,
        );

        if (!validationResult.canCalculate) {
            return { can_calculate: false, errors: validationResult.errors };
        }

        // CRITICAL: Calculate weight discounts first to get final weight
        // The order is: Moho → Humedad → Violetas (sequential, not parallel!)
        const weightDiscountResult = calculateWeightDiscounts(
            data.total_weight,
            {
                moho: combinedQualityMetrics.find(m => m.metric === 'Moho')?.value || 0,
                humedad: combinedQualityMetrics.find(m => m.metric === 'Humedad')?.value || 0,
                violetas: combinedQualityMetrics.find(m => m.metric === 'Violetas')?.value || 0,
            },
            thresholds
        );

        // CRITICAL: Calculate pricing using final weight (after quality discounts)
        // Price = base_price * final_weight (discounts already applied to weight)
        const preview = calculatePricing(
            data.base_price_per_kg,
            weightDiscountResult.final_weight,
            [], // No quality metrics for price calculation
            [], // No thresholds for price calculation
        );

        console.log('✅ Pricing calculation preview:', {
            original_weight: data.total_weight,
            final_weight: weightDiscountResult.final_weight,
            gross_value: preview.gross_value,
            final_total: preview.final_total,
        });

        return { can_calculate: true, data: preview };
    } catch (error) {
        console.error('❌ Unexpected error in calculateReceptionPricing:', error);
        return {
            can_calculate: false,
            errors: ['Error inesperado al calcular precios'],
        };
    }
}

/**
 * Save reception with automatic pricing calculation
 * This creates a pricing calculation record in the database
 * 
 * CRITICAL: This function saves financial data - must be accurate!
 * 
 * @param data - Reception pricing data
 * @param userId - ID of the user creating the reception
 * @returns Success status with pricing calculation ID
 */
export async function saveReceptionWithPricingUtil(
    data: SaveReceptionWithPricingData,
    userId: string,
): Promise<{
    success: boolean;
    error?: string;
    pricingCalculationId?: string;
}> {
    try {
        console.log('💾 saveReceptionWithPricing called with:', data);

        // Get pricing rules and thresholds
        const pricingRuleData = await db
            .select()
            .from(pricingRules)
            .where(eq(pricingRules.fruitType, data.fruit_type))
            .limit(1);

        if (pricingRuleData.length === 0) {
            return { success: false, error: 'Reglas de precios no encontradas' };
        }

        const pricingRule = pricingRuleData[0];

        const thresholdsData = await db
            .select()
            .from(discountThresholds)
            .where(eq(discountThresholds.pricingRuleId, pricingRule.id));

        // Transform thresholds to expected format
        const thresholds = thresholdsData.map(threshold => ({
            id: threshold.id,
            pricing_rule_id: threshold.pricingRuleId,
            quality_metric: threshold.qualityMetric as 'Violetas' | 'Humedad' | 'Moho',
            limit_value: Number(threshold.limitValue),
            created_at: threshold.createdAt?.toISOString() || '',
            updated_at: threshold.updatedAt?.toISOString() || '',
            created_by: threshold.createdBy || undefined,
            updated_by: threshold.updatedBy || undefined,
        }));

        // Validate calculation
        const validationResult = validatePricingCalculation(
            data.fruit_type,
            data.quality_evaluation,
            thresholds,
            pricingRule.qualityBasedPricingEnabled,
        );

        if (!validationResult.canCalculate) {
            return { success: false, error: validationResult.errors.join(', ') };
        }

        // CRITICAL: Calculate weight discounts first to get final weight
        const weightDiscountResult = calculateWeightDiscounts(
            data.total_weight,
            {
                moho: data.quality_evaluation.find(m => m.metric === 'Moho')?.value || 0,
                humedad: data.quality_evaluation.find(m => m.metric === 'Humedad')?.value || 0,
                violetas: data.quality_evaluation.find(m => m.metric === 'Violetas')?.value || 0,
            },
            thresholds
        );

        // CRITICAL: Calculate pricing using final weight (after quality discounts)
        const preview = calculatePricing(
            data.base_price_per_kg,
            weightDiscountResult.final_weight,
            [], // No quality metrics for price calculation
            [], // No thresholds for price calculation
        );

        // Create pricing calculation data for database storage
        const calculationData = {
            quality_metrics: preview.discount_breakdown.map((d) => ({
                metric: d.quality_metric,
                value: d.value,
                discount_percentage: d.discount_percentage,
                discount_amount: d.discount_amount,
            })),
            total_discounts: preview.total_discount_amount,
            timestamp: new Date().toISOString(),
            fruit_type: data.fruit_type,
            applied_thresholds: preview.applied_thresholds,
        };

        // Insert pricing calculation
        const pricingCalculation = await db
            .insert(pricingCalculations)
            .values({
                receptionId: data.farmer_id, // This would be replaced with actual reception ID
                basePricePerKg: data.base_price_per_kg.toString(),
                totalWeight: data.total_weight.toString(),
                grossValue: preview.gross_value.toString(),
                totalDiscountAmount: preview.total_discount_amount.toString(),
                finalTotal: preview.final_total.toString(),
                calculationData: calculationData,
                createdBy: userId,
            })
            .returning();

        if (pricingCalculation.length === 0) {
            console.error('Error saving pricing calculation: no rows returned');
            return {
                success: false,
                error: 'Error al guardar el cálculo de precios',
            };
        }

        console.log('✅ Pricing calculation saved:', pricingCalculation[0].id);
        return { success: true, pricingCalculationId: pricingCalculation[0].id };
    } catch (error) {
        console.error('❌ Unexpected error in saveReceptionWithPricing:', error);
        return {
            success: false,
            error: 'Error inesperado al guardar el cálculo de precios',
        };
    }
}
