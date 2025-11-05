"use server";

import { db } from "@/lib/db";
import { qualityEvaluations, receptions, fruitTypes, users, auditLogs, desgloseDescuentos, pricingRules, discountThresholds } from "@/lib/db/schema";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type {
  QualityEvaluation,
  CreateQualityEvaluationData,
  UpdateQualityEvaluationData,
  QualityEvaluationResponse,
  QualityEvaluationWithReceptionResponse,
} from "@/lib/types/quality-universal";
import {
  validateCreateQuality,
  validateUpdateQuality,
} from "@/lib/schemas/quality-schemas";
import { eq, sql, and } from "drizzle-orm";

// Helper function to calculate quality-based discounts using threshold-based logic
async function calculateQualityDiscounts(receptionId: string, qualityRecord: any) {
  try {
    // Get reception data
    const receptionData = await db
      .select({
        totalPesoOriginal: receptions.totalPesoOriginal,
        fruitTypeId: receptions.fruitTypeId,
      })
      .from(receptions)
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (receptionData.length === 0) {
      console.error("Reception not found for discount calculation");
      return;
    }

    const reception = receptionData[0];
    const originalWeight = Number(reception.totalPesoOriginal) || 0;
    let totalDiscount = 0;
    const discountBreakdown = [];

    // Get fruit type name from ID
    const fruitTypeData = await db
      .select({ type: fruitTypes.type })
      .from(fruitTypes)
      .where(eq(fruitTypes.id, reception.fruitTypeId))
      .limit(1);

    if (fruitTypeData.length === 0) {
      console.error("Fruit type not found for discount calculation");
      return;
    }

    const fruitType = fruitTypeData[0].type;

    // Get discount thresholds for this fruit type
    const thresholdsData = await db
      .select({
        qualityMetric: discountThresholds.qualityMetric,
        limitValue: discountThresholds.limitValue
      })
      .from(discountThresholds)
      .innerJoin(pricingRules, eq(discountThresholds.pricingRuleId, pricingRules.id))
      .where(and(
        eq(pricingRules.fruitType, fruitType),
        eq(pricingRules.qualityBasedPricingEnabled, true)
      ));

    if (thresholdsData.length === 0) {
      console.log("No discount thresholds configured for fruit type:", fruitType);
      return;
    }

    // Transform thresholds to expected format
    const thresholds = thresholdsData.map(t => ({
      quality_metric: t.qualityMetric,
      limit_value: Number(t.limitValue)
    }));

    // Check each quality metric against thresholds using progressive discount logic
    const qualityMetrics = [
      { name: 'Violetas', value: qualityRecord.violetas, metricKey: 'Violetas' },
      { name: 'Humedad', value: qualityRecord.humedad, metricKey: 'Humedad' },
      { name: 'Moho', value: qualityRecord.moho, metricKey: 'Moho' }
    ];

    // Start with original weight and apply discounts progressively
    let currentWeight = originalWeight;

    for (const metric of qualityMetrics) {
      if (metric.value && Number(metric.value) > 0) {
        // Find applicable threshold
        const threshold = thresholds.find(t => t.quality_metric === metric.metricKey);

        if (threshold) {
          const value = Number(metric.value);
          const limit = threshold.limit_value;

          // Calculate discount: if quality value > limit, discount = (quality_value - limit_value)%
          if (value > limit) {
            const excessQuality = value - limit;
            const discountPercentage = excessQuality; // Direct percentage discount
            // Apply discount to current final weight (not original weight)
            const discountAmount = currentWeight * (discountPercentage / 100);

            totalDiscount += discountAmount;

            discountBreakdown.push({
              recepcionId: receptionId,
              parametro: `${metric.name} (Evaluación)`,
              umbral: limit,
              valor: value,
              porcentajeDescuento: discountPercentage,
              pesoDescuento: discountAmount,
              createdBy: qualityRecord.createdBy
            });

            // Update current weight for next discount calculation
            currentWeight = currentWeight - discountAmount;
          }
        }
      }
    }

    // Clear existing quality evaluation discounts
    await db
      .delete(desgloseDescuentos)
      .where(sql`${desgloseDescuentos.recepcionId} = ${receptionId} AND ${desgloseDescuentos.parametro} LIKE '%(Evaluación)%'`);

    // Insert new discount breakdown
    if (discountBreakdown.length > 0) {
      await db.insert(desgloseDescuentos).values(
        discountBreakdown.map(item => ({
          recepcionId: item.recepcionId,
          parametro: item.parametro,
          umbral: item.umbral.toString(),
          valor: item.valor.toString(),
          porcentajeDescuento: item.porcentajeDescuento.toString(),
          pesoDescuento: item.pesoDescuento.toString(),
          createdBy: item.createdBy
        }))
      );
    }

    // Update reception totals - calculate total of ALL discounts
    const currentReception = await db
      .select({
        totalPesoOriginal: receptions.totalPesoOriginal,
        labSampleWetWeight: receptions.labSampleWetWeight,
        labSampleDriedWeight: receptions.labSampleDriedWeight,
      })
      .from(receptions)
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (currentReception.length > 0) {
      const current = currentReception[0];
      const labAdjustment = (Number(current.labSampleDriedWeight) || 0) - (Number(current.labSampleWetWeight) || 0);

      // Calculate total discount from ALL breakdown records (not just quality)
      const allDiscountsResult = await db
        .select({ pesoDescuento: desgloseDescuentos.pesoDescuento })
        .from(desgloseDescuentos)
        .where(eq(desgloseDescuentos.recepcionId, receptionId));

      const totalAllDiscounts = allDiscountsResult.reduce(
        (sum, discount) => sum + Number(discount.pesoDescuento || 0),
        0
      );

      const newTotalFinal = Number(current.totalPesoOriginal) - totalAllDiscounts + labAdjustment;

      await db
        .update(receptions)
        .set({
          totalPesoDescuento: totalAllDiscounts,
          totalPesoFinal: newTotalFinal,
          updatedAt: new Date(),
        })
        .where(eq(receptions.id, receptionId));
    }

  } catch (error) {
    console.error("Error calculating quality discounts:", error);
  }
}

// Get current session
async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

// Check if user is admin
async function checkIsAdmin(session: any): Promise<boolean> {
  if (!session || session.role !== "admin") {
    return false;
  }
  return true;
}

/**
 * Create a new quality evaluation record (works for all fruit types)
 */
export async function createQualityEvaluation(
  data: CreateQualityEvaluationData
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return { success: false, error: "Forbidden: Only administrators can modify quality data" };
  }

  try {
    // Validate input
    const validated = validateCreateQuality(data);
    if (!validated.success) {
      return { success: false, error: validated.error };
    }

    if (!validated.data) {
      return { success: false, error: "Invalid data" };
    }

    // Verify reception exists
    const receptionData = await db
      .select({
        id: receptions.id,
        fruitTypeId: receptions.fruitTypeId,
      })
      .from(receptions)
      .where(eq(receptions.id, validated.data!.recepcion_id))
      .limit(1);

    if (receptionData.length === 0) {
      console.error("Reception ID:", validated.data!.recepcion_id);
      return { success: false, error: "Reception not found" };
    }

    // Check if quality evaluation already exists
    const existingQuality = await db
      .select({ id: qualityEvaluations.id })
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, validated.data!.recepcion_id))
      .limit(1);

    if (existingQuality.length > 0) {
      return { success: false, error: "Quality evaluation already exists for this reception" };
    }

    // Create quality evaluation
    const newQuality = await db
      .insert(qualityEvaluations)
      .values({
        recepcionId: validated.data!.recepcion_id,
        violetas: validated.data!.violetas?.toString(),
        humedad: validated.data!.humedad?.toString(),
        moho: validated.data!.moho?.toString(),
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    if (newQuality.length === 0) {
      console.error("Error creating quality evaluation: no rows returned");
      return { success: false, error: "Failed to create quality evaluation" };
    }

    const qualityRecord = newQuality[0];

    // Calculate quality-based discounts manually since trigger is disabled
    await calculateQualityDiscounts(validated.data!.recepcion_id, qualityRecord);

    // Transform to match expected format
    const quality: QualityEvaluation = {
      id: qualityRecord.id,
      recepcion_id: qualityRecord.recepcionId,
      violetas: qualityRecord.violetas ? Number(qualityRecord.violetas) : 0,
      humedad: qualityRecord.humedad ? Number(qualityRecord.humedad) : 0,
      moho: qualityRecord.moho ? Number(qualityRecord.moho) : 0,
      created_by: qualityRecord.createdBy,
      updated_by: qualityRecord.updatedBy,
      created_at: qualityRecord.createdAt?.toISOString() || '',
      updated_at: qualityRecord.updatedAt?.toISOString() || '',
    };

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "create",
      tableName: "quality_evaluations",
      recordId: quality.id,
    });

    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${validated.data!.recepcion_id}`);
    revalidatePath(`/dashboard/reception/${validated.data!.recepcion_id}/edit`);

    return { success: true, data: quality };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: " + error.errors[0].message };
    }
    console.error("Error in createQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Update an existing quality evaluation record
 */
export async function updateQualityEvaluation(
  recepcionId: string,
  data: UpdateQualityEvaluationData
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return { success: false, error: "Forbidden: Only administrators can modify quality data" };
  }

  try {
    // Validate input
    const validated = validateUpdateQuality(data);
    if (!validated.success) {
      return { success: false, error: validated.error };
    }

    // Get existing quality evaluation
    const existingQuality = await db
      .select({ id: qualityEvaluations.id })
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, recepcionId))
      .limit(1);

    if (existingQuality.length === 0) {
      return { success: false, error: "Quality evaluation not found for this reception" };
    }

    // Update quality evaluation
    const updateData: any = {
      updatedBy: session.id,
      updatedAt: new Date(),
    };

    if (validated.data!.violetas !== undefined) updateData.violetas = validated.data!.violetas.toString();
    if (validated.data!.humedad !== undefined) updateData.humedad = validated.data!.humedad.toString();
    if (validated.data!.moho !== undefined) updateData.moho = validated.data!.moho.toString();

    const updatedQuality = await db
      .update(qualityEvaluations)
      .set(updateData)
      .where(eq(qualityEvaluations.id, existingQuality[0].id))
      .returning();

    if (updatedQuality.length === 0) {
      console.error("Error updating quality evaluation: no rows returned");
      return { success: false, error: "Failed to update quality evaluation" };
    }

    const qualityRecord = updatedQuality[0];

    // Recalculate quality-based discounts manually since trigger is disabled
    await calculateQualityDiscounts(recepcionId, qualityRecord);

    // Recalculate pricing if reception has final weight
    const receptionCheck = await db
      .select({ totalPesoFinal: receptions.totalPesoFinal })
      .from(receptions)
      .where(eq(receptions.id, recepcionId))
      .limit(1);

    if (receptionCheck.length > 0 && receptionCheck[0].totalPesoFinal && Number(receptionCheck[0].totalPesoFinal) > 0) {
      // Import the pricing calculation function
      const { calculatePricingForExistingReception } = await import('./reception-with-pricing');
      await calculatePricingForExistingReception(recepcionId);
    }

    // Transform to match expected format
    const quality: QualityEvaluation = {
      id: qualityRecord.id,
      recepcion_id: qualityRecord.recepcionId,
      violetas: qualityRecord.violetas ? Number(qualityRecord.violetas) : 0,
      humedad: qualityRecord.humedad ? Number(qualityRecord.humedad) : 0,
      moho: qualityRecord.moho ? Number(qualityRecord.moho) : 0,
      created_by: qualityRecord.createdBy,
      updated_by: qualityRecord.updatedBy,
      created_at: qualityRecord.createdAt?.toISOString() || '',
      updated_at: qualityRecord.updatedAt?.toISOString() || '',
    };

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "update",
      tableName: "quality_evaluations",
      recordId: quality.id,
    });

    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${recepcionId}`);
    revalidatePath(`/dashboard/reception/${recepcionId}/edit`);

    return { success: true, data: quality };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: " + error.errors[0].message };
    }
    console.error("Error in updateQualityEvaluation:", error);
return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Get quality evaluation for a specific reception
 */
export async function getQualityEvaluation(
  recepcionId: string
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  try {
    const qualityData = await db
      .select()
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, recepcionId))
      .limit(1);

    if (qualityData.length === 0) {
      return { success: true, data: undefined };
    }

    const qualityRecord = qualityData[0];

    // Transform to match expected format
    const quality: QualityEvaluation = {
      id: qualityRecord.id,
      recepcion_id: qualityRecord.recepcionId,
      violetas: qualityRecord.violetas ? Number(qualityRecord.violetas) : 0,
      humedad: qualityRecord.humedad ? Number(qualityRecord.humedad) : 0,
      moho: qualityRecord.moho ? Number(qualityRecord.moho) : 0,
      created_by: qualityRecord.createdBy,
      updated_by: qualityRecord.updatedBy,
      created_at: qualityRecord.createdAt?.toISOString() || '',
      updated_at: qualityRecord.updatedAt?.toISOString() || '',
    };

    return { success: true, data: quality };
  } catch (error: any) {
    console.error("Error in getQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Get quality evaluation with full reception details
 */
export async function getQualityEvaluationWithReception(
  recepcionId: string
): Promise<QualityEvaluationWithReceptionResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  try {
    // Get reception details with fruit type
    const receptionData = await db
      .select({
        id: receptions.id,
        receptionNumber: receptions.receptionNumber,
        providerId: receptions.providerId,
        driverId: receptions.driverId,
        fruitTypeId: receptions.fruitTypeId,
        truckPlate: receptions.truckPlate,
        totalContainers: receptions.totalContainers,
        totalWeight: receptions.totalWeight,
        status: receptions.status,
        createdAt: receptions.createdAt,
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
      })
      .from(receptions)
      .innerJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
      .where(eq(receptions.id, recepcionId))
      .limit(1);

    if (receptionData.length === 0) {
      return { success: false, error: "Reception not found" };
    }

    const reception = receptionData[0];

    // Get quality data
    const qualityData = await db
      .select()
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, recepcionId))
      .limit(1);

    let quality: QualityEvaluation | null = null;
    let createdByUser = null;
    let updatedByUser = null;

    if (qualityData.length > 0) {
      const qualityRecord = qualityData[0];
      quality = {
        id: qualityRecord.id,
        recepcion_id: qualityRecord.recepcionId,
        violetas: qualityRecord.violetas ? Number(qualityRecord.violetas) : 0,
        humedad: qualityRecord.humedad ? Number(qualityRecord.humedad) : 0,
        moho: qualityRecord.moho ? Number(qualityRecord.moho) : 0,
        created_by: qualityRecord.createdBy,
        updated_by: qualityRecord.updatedBy,
        created_at: qualityRecord.createdAt?.toISOString() || '',
        updated_at: qualityRecord.updatedAt?.toISOString() || '',
      };

      // Get user details for created_by and updated_by
      const creatorData = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.id, quality.created_by))
        .limit(1);

      const updaterData = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.id, quality.updated_by))
        .limit(1);

      if (creatorData.length > 0) createdByUser = creatorData[0];
      if (updaterData.length > 0) updatedByUser = updaterData[0];
    }

    // Transform reception data to expected format
    const receptionFormatted = {
      id: reception.id,
      reception_number: reception.receptionNumber,
      provider_id: reception.providerId,
      driver_id: reception.driverId,
      fruit_type_id: reception.fruitTypeId,
      truck_plate: reception.truckPlate,
      total_containers: Number(reception.totalContainers),
      total_weight: Number(reception.totalWeight),
      status: reception.status,
      created_at: reception.createdAt?.toISOString() || '',
      fruit_type: reception.fruitType,
      fruit_subtype: reception.fruitSubtype,
    };

    return {
      success: true,
      data: {
        quality: quality,
        reception: receptionFormatted,
        created_by_user: createdByUser,
        updated_by_user: updatedByUser,
      },
    };
  } catch (error: any) {
    console.error("Error in getQualityEvaluationWithReception:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Delete quality evaluation for a reception
 */
export async function deleteQualityEvaluation(
  recepcionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return { success: false, error: "Forbidden: Only administrators can delete quality data" };
  }

  try {
    // Delete quality evaluation
    await db
      .delete(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, recepcionId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "delete",
      tableName: "quality_evaluations",
      recordId: recepcionId,
    });

    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${recepcionId}`);
    revalidatePath(`/dashboard/reception/${recepcionId}/edit`);

    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}
