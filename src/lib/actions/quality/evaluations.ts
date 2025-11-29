import { db } from '~/lib/db';
import { qualityEvaluations, auditLogs } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { CreateQualityEvaluationData } from './types';

export async function createQualityEvaluation(data: CreateQualityEvaluationData, userId: string) {
    try {
        // Check if evaluation already exists for this reception
        const existing = await db
            .select()
            .from(qualityEvaluations)
            .where(eq(qualityEvaluations.recepcionId, data.receptionId))
            .limit(1);

        if (existing.length > 0) {
            return { success: false, error: 'Ya existe una evaluación de calidad para esta recepción' };
        }

        const [newEvaluation] = await db.insert(qualityEvaluations).values({
            recepcionId: data.receptionId,
            violetas: data.violetas.toString(),
            humedad: data.humedad.toString(),
            moho: data.moho.toString(),
            createdBy: userId,
            updatedBy: userId,
        }).returning();

        // Log action
        await db.insert(auditLogs).values({
            userId: userId,
            action: 'create',
            tableName: 'quality_evaluations',
            recordId: newEvaluation.id,
            newValues: newEvaluation,
        });

        return { success: true, data: newEvaluation };
    } catch (error) {
        console.error('Error creating quality evaluation:', error);
        return { success: false, error: 'Error al crear la evaluación de calidad' };
    }
}

export async function updateQualityEvaluation(id: string, data: Partial<CreateQualityEvaluationData>, userId: string) {
    try {
        const [existing] = await db
            .select()
            .from(qualityEvaluations)
            .where(eq(qualityEvaluations.id, id))
            .limit(1);

        if (!existing) {
            return { success: false, error: 'Evaluación no encontrada' };
        }

        const updateData: any = {
            updatedBy: userId,
            updatedAt: new Date(),
        };

        if (data.violetas !== undefined) updateData.violetas = data.violetas.toString();
        if (data.humedad !== undefined) updateData.humedad = data.humedad.toString();
        if (data.moho !== undefined) updateData.moho = data.moho.toString();

        const [updated] = await db
            .update(qualityEvaluations)
            .set(updateData)
            .where(eq(qualityEvaluations.id, id))
            .returning();

        // Log action
        await db.insert(auditLogs).values({
            userId: userId,
            action: 'update',
            tableName: 'quality_evaluations',
            recordId: id,
            oldValues: existing,
            newValues: updated,
        });

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error updating quality evaluation:', error);
        return { success: false, error: 'Error al actualizar la evaluación de calidad' };
    }
}

export async function getQualityEvaluationByReceptionId(receptionId: string) {
    try {
        const [evaluation] = await db
            .select()
            .from(qualityEvaluations)
            .where(eq(qualityEvaluations.recepcionId, receptionId))
            .limit(1);

        return evaluation || null;
    } catch (error) {
        console.error('Error fetching quality evaluation:', error);
        return null;
    }
}
