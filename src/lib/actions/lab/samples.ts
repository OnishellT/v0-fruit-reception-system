import { db } from '~/lib/db';
import { laboratorySamples, auditLogs, receptions } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { CreateLabSampleData, UpdateLabSampleData } from '~/lib/actions/quality/types';
import { recalculateReceptionWeights } from '~/lib/actions/receptions/calculate-weights';

export async function createLabSample(data: CreateLabSampleData, userId: string) {
    try {
        if (!data.receptionId && !data.batchId) {
            return { success: false, error: 'Debe especificar una recepción o un lote' };
        }

        // Check if sample already exists
        const whereClause = data.receptionId
            ? eq(laboratorySamples.receptionId, data.receptionId)
            : eq(laboratorySamples.batchId, data.batchId!);

        const existing = await db
            .select()
            .from(laboratorySamples)
            .where(whereClause)
            .limit(1);

        if (existing.length > 0) {
            return { success: false, error: 'Ya existe una muestra de laboratorio para este registro' };
        }

        const [newSample] = await db.insert(laboratorySamples).values({
            receptionId: data.receptionId,
            batchId: data.batchId,
            sampleWeight: data.sampleWeight.toString(),
            estimatedDryingDays: data.estimatedDryingDays,
            status: 'Drying',
        }).returning();

        // Log action
        await db.insert(auditLogs).values({
            userId: userId,
            action: 'create',
            tableName: 'laboratory_samples',
            recordId: newSample.id,
            newValues: newSample,
            newValues: newSample,
        });

        if (newSample.receptionId) {
            await recalculateReceptionWeights(newSample.receptionId);
        }

        return { success: true, data: newSample };
    } catch (error) {
        console.error('Error creating lab sample:', error);
        return { success: false, error: 'Error al crear la muestra de laboratorio' };
    }
}

export async function updateLabSample(data: UpdateLabSampleData, userId: string) {
    try {
        const [existing] = await db
            .select()
            .from(laboratorySamples)
            .where(eq(laboratorySamples.id, data.id))
            .limit(1);

        if (!existing) {
            return { success: false, error: 'Muestra no encontrada' };
        }

        const updateData: any = {
            status: data.status,
        };

        if (data.driedSampleKg !== undefined) updateData.driedSampleKg = data.driedSampleKg.toString();
        if (data.violetasPercentage !== undefined) updateData.violetasPercentage = data.violetasPercentage.toString();
        if (data.mohoPercentage !== undefined) updateData.mohoPercentage = data.mohoPercentage.toString();
        if (data.basuraPercentage !== undefined) updateData.basuraPercentage = data.basuraPercentage.toString();

        const [updated] = await db
            .update(laboratorySamples)
            .set(updateData)
            .where(eq(laboratorySamples.id, data.id))
            .returning();

        // Log action
        await db.insert(auditLogs).values({
            userId: userId,
            action: 'update',
            tableName: 'laboratory_samples',
            recordId: data.id,
            oldValues: existing,
            newValues: updated,
        });

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error updating lab sample:', error);
        return { success: false, error: 'Error al actualizar la muestra de laboratorio' };
    }
}

export async function getLabSampleByReceptionId(receptionId: string) {
    try {
        const [sample] = await db
            .select()
            .from(laboratorySamples)
            .where(eq(laboratorySamples.receptionId, receptionId))
            .limit(1);

        return sample || null;
    } catch (error) {
        console.error('Error fetching lab sample:', error);
        return null;
    }
}

export async function getAllLabSamples() {
    try {
        // Join with receptions to get provider and reception info
        // Note: Drizzle relations would be cleaner, but explicit join is fine too
        const samples = await db.query.laboratorySamples.findMany({
            with: {
                reception: {
                    with: {
                        provider: true,
                    }
                }
            },
            orderBy: (samples, { desc }) => [desc(samples.id)], // Ideally order by created_at but it's not in schema?
        });

        return samples;
    } catch (error) {
        console.error('Error fetching all lab samples:', error);
        return [];
    }
}
