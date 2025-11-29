/**
 * Discount Thresholds CRUD for Qwik City
 * Migrated from Next.js server actions to Qwik utility functions
 */

import { db } from '~/lib/db';
import { discountThresholds, pricingRules } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import type {
    DiscountThreshold,
    CreateDiscountThresholdData,
    UpdateDiscountThresholdData,
    DiscountThresholdResponse
} from '~/lib/actions/types';

/**
 * Get all discount thresholds for a fruit type
 * 
 * @param fruitType - Fruit type name ('CAFÉ', 'CACAO', etc.)
 * @returns Array of discount thresholds or error
 */
export async function getAllDiscountThresholds(
    fruitType: string,
): Promise<{ success: boolean; data?: DiscountThreshold[]; error?: string }> {
    try {
        console.log('🔍 getAllDiscountThresholds called for:', fruitType);

        // Get pricing rule for the fruit type
        const pricingRuleData = await db
            .select({ id: pricingRules.id })
            .from(pricingRules)
            .where(eq(pricingRules.fruitType, fruitType))
            .limit(1);

        if (pricingRuleData.length === 0) {
            return { success: false, error: 'Regla de precios no encontrada' };
        }

        const pricingRule = pricingRuleData[0];

        // Get discount thresholds
        const thresholdsData = await db
            .select()
            .from(discountThresholds)
            .where(eq(discountThresholds.pricingRuleId, pricingRule.id))
            .orderBy(discountThresholds.qualityMetric, discountThresholds.limitValue);

        // Transform to match expected format
        const thresholds = thresholdsData.map(threshold => ({
            id: threshold.id,
            pricing_rule_id: threshold.pricingRuleId,
            quality_metric: threshold.qualityMetric,
            limit_value: Number(threshold.limitValue),
            created_at: threshold.createdAt?.toISOString(),
            updated_at: threshold.updatedAt?.toISOString(),
            created_by: threshold.createdBy,
            updated_by: threshold.updatedBy,
        }));

        console.log(`✅ Found ${thresholds.length} thresholds`);
        return { success: true, data: thresholds as DiscountThreshold[] };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: 'Error inesperado al obtener los umbrales',
        };
    }
}

/**
 * Create a new discount threshold
 * Admin-only operation
 * 
 * @param data - Threshold creation data
 * @param userId - ID of the admin user
 * @returns Created threshold or error
 */
export async function createDiscountThresholdUtil(
    data: CreateDiscountThresholdData,
    userId: string,
): Promise<DiscountThresholdResponse> {
    try {
        console.log('➕ Creating discount threshold:', data);

        // Create threshold
        const newThreshold = await db
            .insert(discountThresholds)
            .values({
                pricingRuleId: data.pricing_rule_id,
                qualityMetric: data.quality_metric,
                limitValue: data.limit_value.toString(),
                createdBy: userId,
            })
            .returning();

        if (newThreshold.length === 0) {
            console.error('Error creating discount threshold: no rows returned');
            return { success: false, error: 'Error al crear el umbral de descuento' };
        }

        const threshold = newThreshold[0];

        // Transform to match expected format
        const result = {
            id: threshold.id,
            pricing_rule_id: threshold.pricingRuleId,
            quality_metric: threshold.qualityMetric,
            limit_value: Number(threshold.limitValue),
            created_at: threshold.createdAt?.toISOString(),
            updated_at: threshold.updatedAt?.toISOString(),
            created_by: threshold.createdBy,
            updated_by: threshold.updatedBy,
        };

        console.log('✅ Threshold created successfully:', result.id);
        return { success: true, data: result as DiscountThreshold };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'Error inesperado al crear el umbral' };
    }
}

/**
 * Update an existing discount threshold
 * Admin-only operation
 * 
 * @param data - Threshold update data
 * @param userId - ID of the admin user
 * @returns Updated threshold or error
 */
export async function updateDiscountThresholdUtil(
    data: UpdateDiscountThresholdData,
    userId: string,
): Promise<DiscountThresholdResponse> {
    try {
        console.log('🔄 Updating discount threshold:', data);

        // Update threshold
        const updatedThreshold = await db
            .update(discountThresholds)
            .set({
                limitValue: data.limit_value.toString(),
                updatedBy: userId,
                updatedAt: new Date(),
            })
            .where(eq(discountThresholds.id, data.id))
            .returning();

        console.log('📊 Update result:', updatedThreshold);

        if (updatedThreshold.length === 0) {
            console.error('No threshold returned from update');
            return { success: false, error: 'No se pudo actualizar el umbral' };
        }

        const threshold = updatedThreshold[0];

        // Transform to match expected format
        const result = {
            id: threshold.id,
            pricing_rule_id: threshold.pricingRuleId,
            quality_metric: threshold.qualityMetric,
            limit_value: Number(threshold.limitValue),
            created_at: threshold.createdAt?.toISOString(),
            updated_at: threshold.updatedAt?.toISOString(),
            created_by: threshold.createdBy,
            updated_by: threshold.updatedBy,
        };

        console.log('✅ Threshold updated successfully');
        return { success: true, data: result as DiscountThreshold };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: 'Error inesperado al actualizar el umbral',
        };
    }
}

/**
 * Delete a discount threshold
 * Admin-only operation
 * 
 * @param id - UUID of the threshold to delete
 * @returns Success status or error
 */
export async function deleteDiscountThresholdUtil(
    id: string,
): Promise<{ success: boolean; error?: string; deletedId?: string }> {
    try {
        console.log('🗑️ Deleting discount threshold:', id);

        // Delete threshold
        await db
            .delete(discountThresholds)
            .where(eq(discountThresholds.id, id));

        console.log('✅ Threshold deleted successfully');
        return { success: true, deletedId: id };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'Error inesperado al eliminar el umbral' };
    }
}

/**
 * Get a single discount threshold by ID
 * 
 * @param id - UUID of the threshold
 * @returns Threshold data or error
 */
export async function getDiscountThresholdById(
    id: string,
): Promise<DiscountThresholdResponse> {
    try {
        const thresholdData = await db
            .select()
            .from(discountThresholds)
            .where(eq(discountThresholds.id, id))
            .limit(1);

        if (thresholdData.length === 0) {
            return { success: false, error: 'Umbral no encontrado' };
        }

        const threshold = thresholdData[0];

        const result = {
            id: threshold.id,
            pricing_rule_id: threshold.pricingRuleId,
            quality_metric: threshold.qualityMetric,
            limit_value: Number(threshold.limitValue),
            created_at: threshold.createdAt?.toISOString(),
            updated_at: threshold.updatedAt?.toISOString(),
            created_by: threshold.createdBy,
            updated_by: threshold.updatedBy,
        };

        return { success: true, data: result as DiscountThreshold };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'Error al obtener el umbral' };
    }
}
