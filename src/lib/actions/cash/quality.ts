import { db } from '~/lib/db';
import { cashQualityThresholds, cashFruitTypes } from '~/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface CreateQualityThresholdData {
    fruitTypeId: number;
    metric: string;
    thresholdPercent: number;
}

export interface UpdateQualityThresholdData {
    id: number;
    thresholdPercent: number;
    enabled: boolean;
}

export async function createQualityThreshold(data: CreateQualityThresholdData) {
    try {
        // Check for duplicate (same fruit type + same metric)
        const existing = await db
            .select()
            .from(cashQualityThresholds)
            .where(
                and(
                    eq(cashQualityThresholds.fruitTypeId, data.fruitTypeId),
                    eq(cashQualityThresholds.metric, data.metric)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return {
                success: false,
                error: 'Ya existe un umbral para este tipo de fruta y métrica'
            };
        }

        const [newThreshold] = await db
            .insert(cashQualityThresholds)
            .values({
                fruitTypeId: data.fruitTypeId,
                metric: data.metric,
                thresholdPercent: data.thresholdPercent.toString(),
                enabled: true,
            })
            .returning();

        return { success: true, data: newThreshold };
    } catch (error) {
        console.error('Error creating quality threshold:', error);
        return { success: false, error: 'Error al crear el umbral de calidad' };
    }
}

export async function updateQualityThreshold(data: UpdateQualityThresholdData) {
    try {
        const [updated] = await db
            .update(cashQualityThresholds)
            .set({
                thresholdPercent: data.thresholdPercent.toString(),
                enabled: data.enabled,
            })
            .where(eq(cashQualityThresholds.id, data.id))
            .returning();

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error updating quality threshold:', error);
        return { success: false, error: 'Error al actualizar el umbral' };
    }
}

export async function deleteQualityThreshold(id: number) {
    try {
        await db
            .delete(cashQualityThresholds)
            .where(eq(cashQualityThresholds.id, id));

        return { success: true };
    } catch (error) {
        console.error('Error deleting quality threshold:', error);
        return { success: false, error: 'Error al eliminar el umbral' };
    }
}

export async function getAllQualityThresholds() {
    try {
        const thresholds = await db
            .select({
                id: cashQualityThresholds.id,
                fruitTypeId: cashQualityThresholds.fruitTypeId,
                fruitTypeName: cashFruitTypes.name,
                metric: cashQualityThresholds.metric,
                thresholdPercent: cashQualityThresholds.thresholdPercent,
                enabled: cashQualityThresholds.enabled,
                createdAt: cashQualityThresholds.createdAt,
            })
            .from(cashQualityThresholds)
            .innerJoin(cashFruitTypes, eq(cashQualityThresholds.fruitTypeId, cashFruitTypes.id))
            .orderBy(cashFruitTypes.name, cashQualityThresholds.metric);

        return thresholds;
    } catch (error) {
        console.error('Error fetching quality thresholds:', error);
        return [];
    }
}
