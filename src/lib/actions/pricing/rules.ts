/**
 * Pricing Rules management for Qwik City
 * Migrated from Next.js server actions to Qwik routeAction$/routeLoader$
 */

import { db } from '~/lib/db';
import { pricingRules, discountThresholds, fruitTypes, auditLogs } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, successResponse, errorResponse } from '~/lib/actions/common';
import type { PricingRuleResponse, UpdatePricingRuleData } from '~/lib/actions/types';

/**
 * Get pricing rules for a specific fruit type
 * This is a utility function (not a route action) that can be called from loaders
 * 
 * @param fruitTypeId - UUID of the fruit type
 * @returns Pricing rule with thresholds or error response
 */
export async function getPricingRules(
    fruitTypeId: string,
): Promise<PricingRuleResponse> {
    try {
        console.log('🔍 getPricingRules called with fruitTypeId:', fruitTypeId);

        // First get the fruit type name from the ID
        const fruitTypeData = await db
            .select({ type: fruitTypes.type })
            .from(fruitTypes)
            .where(eq(fruitTypes.id, fruitTypeId))
            .limit(1);

        if (fruitTypeData.length === 0) {
            console.error('Fruit type not found');
            return { success: false, error: 'Error al obtener el tipo de fruta' };
        }

        const fruitType = fruitTypeData[0];
        console.log('📋 Found fruit type:', fruitType.type);

        // Now get the pricing rule with thresholds
        const pricingRuleData = await db
            .select({
                id: pricingRules.id,
                fruitType: pricingRules.fruitType,
                qualityBasedPricingEnabled: pricingRules.qualityBasedPricingEnabled,
                createdAt: pricingRules.createdAt,
                updatedAt: pricingRules.updatedAt,
                createdBy: pricingRules.createdBy,
                updatedBy: pricingRules.updatedBy,
                discountThresholds: {
                    id: discountThresholds.id,
                    pricingRuleId: discountThresholds.pricingRuleId,
                    qualityMetric: discountThresholds.qualityMetric,
                    limitValue: discountThresholds.limitValue,
                    createdAt: discountThresholds.createdAt,
                    updatedAt: discountThresholds.updatedAt,
                    createdBy: discountThresholds.createdBy,
                    updatedBy: discountThresholds.updatedBy,
                },
            })
            .from(pricingRules)
            .leftJoin(discountThresholds, eq(pricingRules.id, discountThresholds.pricingRuleId))
            .where(eq(pricingRules.fruitType, fruitType.type));

        if (pricingRuleData.length === 0) {
            console.log('❌ No pricing rule found for fruit type:', fruitType.type);
            return { success: false, error: 'Reglas de precios no encontradas' };
        }

        // Group the results to match the expected structure
        const pricingRule = pricingRuleData[0];
        const discountThresholdsArray = pricingRuleData
            .filter(item => item.discountThresholds?.id)
            .map(item => item.discountThresholds!);

        const result = {
            id: pricingRule.id,
            fruit_type: pricingRule.fruitType,
            quality_based_pricing_enabled: pricingRule.qualityBasedPricingEnabled,
            created_at: pricingRule.createdAt,
            updated_at: pricingRule.updatedAt,
            created_by: pricingRule.createdBy,
            updated_by: pricingRule.updatedBy,
            discount_thresholds: discountThresholdsArray,
        };

        console.log('✅ Found pricing rule with thresholds:', {
            pricingRuleId: pricingRule.id,
            fruitType: pricingRule.fruitType,
            qualityBasedPricingEnabled: pricingRule.qualityBasedPricingEnabled,
            thresholdCount: discountThresholdsArray.length,
        });

        return { success: true, data: result as any };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: 'Error inesperado al obtener las reglas de precios',
        };
    }
}

/**
 * Update pricing rules (enable/disable quality-based pricing)
 * This is a utility function that can be called from route actions
 * 
 * @param data - Update pricing rule data
 * @param userId - ID of the user making the update (admin)
 * @returns Updated pricing rule or error response
 */
export async function updatePricingRulesUtil(
    data: UpdatePricingRuleData,
    userId: string,
): Promise<PricingRuleResponse> {
    try {
        console.log('🔄 updatePricingRules called with:', data);

        // Update pricing rule
        const updatedRule = await db
            .update(pricingRules)
            .set({
                qualityBasedPricingEnabled: data.quality_based_pricing_enabled,
                updatedBy: userId,
                updatedAt: new Date(),
            })
            .where(eq(pricingRules.fruitType, data.fruit_type))
            .returning();

        if (updatedRule.length === 0) {
            console.error('Error updating pricing rules: no rows updated');
            return {
                success: false,
                error: 'Error al actualizar las reglas de precios',
            };
        }

        // Log the pricing change
        try {
            await db.insert(auditLogs).values({
                userId: userId,
                action: 'pricing_rule_update',
                tableName: 'pricing_rules',
                recordId: updatedRule[0].id,
                newValues: {
                    quality_based_pricing_enabled: data.quality_based_pricing_enabled,
                },
            });
        } catch (logError: any) {
            // Don't fail the whole operation if logging fails
            console.warn('Warning: Failed to log pricing change:', logError);
        }

        console.log('✅ Pricing rule updated successfully');
        return { success: true, data: updatedRule[0] as any };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: 'Error inesperado al actualizar las reglas de precios',
        };
    }
}

/**
 * Get pricing rules by fruit type name (alternative to ID lookup)
 * 
 * @param fruitTypeName - Name of the fruit type ('CAFÉ', 'CACAO', etc.)
 * @returns Pricing rule with thresholds or error response
 */
export async function getPricingRulesByFruitType(
    fruitTypeName: string,
): Promise<PricingRuleResponse> {
    try {
        console.log('🔍 getPricingRulesByFruitType called with:', fruitTypeName);

        // Get the pricing rule with thresholds
        const pricingRuleData = await db
            .select({
                id: pricingRules.id,
                fruitType: pricingRules.fruitType,
                qualityBasedPricingEnabled: pricingRules.qualityBasedPricingEnabled,
                createdAt: pricingRules.createdAt,
                updatedAt: pricingRules.updatedAt,
                createdBy: pricingRules.createdBy,
                updatedBy: pricingRules.updatedBy,
                discountThresholds: {
                    id: discountThresholds.id,
                    pricingRuleId: discountThresholds.pricingRuleId,
                    qualityMetric: discountThresholds.qualityMetric,
                    limitValue: discountThresholds.limitValue,
                    createdAt: discountThresholds.createdAt,
                    updatedAt: discountThresholds.updatedAt,
                    createdBy: discountThresholds.createdBy,
                    updatedBy: discountThresholds.updatedBy,
                },
            })
            .from(pricingRules)
            .leftJoin(discountThresholds, eq(pricingRules.id, discountThresholds.pricingRuleId))
            .where(eq(pricingRules.fruitType, fruitTypeName));

        if (pricingRuleData.length === 0) {
            return { success: false, error: 'Reglas de precios no encontradas' };
        }

        // Group the results
        const pricingRule = pricingRuleData[0];
        const discountThresholdsArray = pricingRuleData
            .filter(item => item.discountThresholds?.id)
            .map(item => item.discountThresholds!);

        const result = {
            id: pricingRule.id,
            fruit_type: pricingRule.fruitType,
            quality_based_pricing_enabled: pricingRule.qualityBasedPricingEnabled,
            created_at: pricingRule.createdAt,
            updated_at: pricingRule.updatedAt,
            created_by: pricingRule.createdBy,
            updated_by: pricingRule.updatedBy,
            discount_thresholds: discountThresholdsArray,
        };

        return { success: true, data: result as any };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: 'Error inesperado al obtener las reglas de precios',
        };
    }
}
