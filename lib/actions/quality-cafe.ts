"use server";

import { db } from "@/lib/db";
import { calidadCafe, receptions, fruitTypes, users, auditLogs } from "@/lib/db/schema";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  createQualitySchema,
  updateQualitySchema,
} from "@/lib/utils/quality-validations";
import type {
  CalidadCafe,
  CreateQualityEvaluationData,
  UpdateQualityEvaluationData,
  QualityEvaluationResponse,
  QualityEvaluationWithReceptionResponse,
} from "@/lib/types/quality-cafe";
import type { QualityEvaluationData } from "@/lib/types/pricing";
import { eq, and } from "drizzle-orm";

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
 * Create a new quality evaluation record
 */
export async function createQualityEvaluation(
  data: CreateQualityEvaluationData,
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return {
      success: false,
      error: "Forbidden: Only administrators can modify quality data",
    };
  }

  try {
    // Validate input
    const validated = createQualitySchema.parse(data);

    // Verify reception exists and is Café Seco
    const receptionData = await db
      .select({
        id: receptions.id,
        fruitTypeId: receptions.fruitTypeId,
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
      })
      .from(receptions)
      .innerJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
      .where(eq(receptions.id, validated.recepcion_id))
      .limit(1);

    if (receptionData.length === 0) {
      return { success: false, error: "Reception not found" };
    }

    const reception = receptionData[0];

    // Check if fruit type is CAFÉ and subtype is Seco
    if (
      reception.fruitType !== "CAFÉ" ||
      reception.fruitSubtype !== "Seco"
    ) {
      return {
        success: false,
        error: "Quality evaluation is only available for Café Seco receptions",
      };
    }

    // Check if quality evaluation already exists
    const existingQuality = await db
      .select({ id: calidadCafe.id })
      .from(calidadCafe)
      .where(eq(calidadCafe.recepcionId, validated.recepcion_id))
      .limit(1);

    if (existingQuality.length > 0) {
      return {
        success: false,
        error: "Quality evaluation already exists for this reception",
      };
    }

    // Create quality evaluation
    const newQuality = await db
      .insert(calidadCafe)
      .values({
        recepcionId: validated.recepcion_id,
        violetas: validated.violetas.toString(),
        humedad: validated.humedad.toString(),
        moho: validated.moho.toString(),
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    if (newQuality.length === 0) {
      console.error("Error creating quality evaluation: no rows returned");
      return { success: false, error: "Failed to create quality evaluation" };
    }

    const qualityRecord = newQuality[0];

    // Transform to match expected format
    const quality: CalidadCafe = {
      id: qualityRecord.id,
      recepcion_id: qualityRecord.recepcionId,
      violetas: Number(qualityRecord.violetas),
      humedad: Number(qualityRecord.humedad),
      moho: Number(qualityRecord.moho),
      created_by: qualityRecord.createdBy,
      updated_by: qualityRecord.updatedBy,
      created_at: qualityRecord.createdAt?.toISOString(),
      updated_at: qualityRecord.updatedAt?.toISOString(),
    };

    // Calculate and save weight discounts based on quality evaluation
    try {
      console.log(
        "🧮 Starting weight discount calculation for quality evaluation...",
      );
      console.log("📋 Quality data:", {
        moho: validated.moho,
        humedad: validated.humedad,
        violetas: validated.violetas,
      });
      console.log("🆔 Reception ID:", validated.recepcion_id);

      const { saveWeightDiscountCalculation } = await import("./pricing");

      // Get reception details for discount calculation
      console.log("📡 Fetching reception details...");
      const receptionDetailsData = await db
        .select({
          totalPesoOriginal: receptions.totalPesoOriginal,
          fruitTypeId: receptions.fruitTypeId,
        })
        .from(receptions)
        .where(eq(receptions.id, validated.recepcion_id))
        .limit(1);

      console.log("📊 Reception details result:", receptionDetailsData);

      if (receptionDetailsData.length > 0) {
        const receptionDetails = receptionDetailsData[0];
        console.log("✅ Reception details found:", receptionDetails);

        // Prepare quality data for discount calculation
        const qualityData = {
          moho: validated.moho,
          humedad: validated.humedad,
          violetas: validated.violetas,
        };

        const discountPayload = {
          reception_id: validated.recepcion_id,
          total_weight: Number(receptionDetails.totalPesoOriginal) || 0,
          quality_data: qualityData,
          fruit_type_id: receptionDetails.fruitTypeId,
        };

        console.log("🎯 Discount calculation payload:", discountPayload);

        console.log("💾 Calling saveWeightDiscountCalculation...");
        const discountResult =
          await saveWeightDiscountCalculation(discountPayload);

        console.log("📈 Discount calculation result:", discountResult);

        if (discountResult.success) {
          console.log(
            "✅ Weight discounts calculated and saved from quality evaluation",
          );
        } else {
          console.warn(
            "⚠️ Failed to calculate weight discounts:",
            discountResult.error,
          );
        }
      } else {
        console.error("❌ Failed to get reception details: no data returned");
      }
    } catch (discountError) {
      console.error(
        "❌ Error calculating weight discounts from quality evaluation:",
        discountError,
      );
      // Don't fail the quality save if discount calculation fails
    }

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "create",
      tableName: "calidad_cafe",
      recordId: quality.id,
    });

    return { success: true, data: quality };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed: " + error.errors[0].message,
      };
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
  data: UpdateQualityEvaluationData,
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return {
      success: false,
      error: "Forbidden: Only administrators can modify quality data",
    };
  }

  try {
    // Validate input
    const validated = updateQualitySchema.parse(data);

    // Get existing quality evaluation
    const existingQuality = await db
      .select({ id: calidadCafe.id })
      .from(calidadCafe)
      .where(eq(calidadCafe.recepcionId, recepcionId))
      .limit(1);

    if (existingQuality.length === 0) {
      return {
        success: false,
        error: "Quality evaluation not found for this reception",
      };
    }

    // Update quality evaluation
    const updatedQuality = await db
      .update(calidadCafe)
      .set({
        violetas: validated.violetas?.toString(),
        humedad: validated.humedad?.toString(),
        moho: validated.moho?.toString(),
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(calidadCafe.id, existingQuality[0].id))
      .returning();

    if (updatedQuality.length === 0) {
      console.error("Error updating quality evaluation: no rows returned");
      return { success: false, error: "Failed to update quality evaluation" };
    }

    const qualityRecord = updatedQuality[0];

    // Transform to match expected format
    const quality: CalidadCafe = {
      id: qualityRecord.id,
      recepcion_id: qualityRecord.recepcionId,
      violetas: Number(qualityRecord.violetas),
      humedad: Number(qualityRecord.humedad),
      moho: Number(qualityRecord.moho),
      created_by: qualityRecord.createdBy,
      updated_by: qualityRecord.updatedBy,
      created_at: qualityRecord.createdAt?.toISOString(),
      updated_at: qualityRecord.updatedAt?.toISOString(),
    };

    // Calculate and save weight discounts based on updated quality evaluation
    try {
      console.log(
        "🔄 Recalculating weight discounts for updated quality evaluation...",
      );
      const { saveWeightDiscountCalculation } = await import("./pricing");

      // Get reception details for discount calculation
      const receptionDetailsData = await db
        .select({
          totalPesoOriginal: receptions.totalPesoOriginal,
          fruitTypeId: receptions.fruitTypeId,
        })
        .from(receptions)
        .where(eq(receptions.id, recepcionId))
        .limit(1);

      if (receptionDetailsData.length > 0) {
        const receptionDetails = receptionDetailsData[0];
        // Prepare quality data for discount calculation
        const qualityData: QualityEvaluationData = {
          moho: validated.moho || 0,
          humedad: validated.humedad || 0,
          violetas: validated.violetas || 0,
        };

        const discountResult = await saveWeightDiscountCalculation({
          reception_id: recepcionId,
          total_weight: Number(receptionDetails.totalPesoOriginal) || 0,
          quality_data: qualityData,
          fruit_type_id: receptionDetails.fruitTypeId,
        });

        if (discountResult.success) {
          console.log(
            "✅ Weight discounts recalculated and saved from quality evaluation update",
          );
        } else {
          console.warn(
            "⚠️ Failed to recalculate weight discounts:",
            discountResult.error,
          );
        }
      }
    } catch (discountError) {
      console.warn(
        "⚠️ Error recalculating weight discounts from quality evaluation update:",
        discountError,
      );
      // Don't fail the quality save if discount calculation fails
    }

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "update",
      tableName: "calidad_cafe",
      recordId: quality.id,
    });

    return { success: true, data: quality };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed: " + error.errors[0].message,
      };
    }
    console.error("Error in updateQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Get quality evaluation for a specific reception
 */
export async function getQualityEvaluation(
  recepcionId: string,
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  try {
    const qualityData = await db
      .select()
      .from(calidadCafe)
      .where(eq(calidadCafe.recepcionId, recepcionId))
      .limit(1);

    if (qualityData.length === 0) {
      return { success: true, data: undefined };
    }

    const qualityRecord = qualityData[0];

    // Transform to match expected format
    const quality: CalidadCafe = {
      id: qualityRecord.id,
      recepcion_id: qualityRecord.recepcionId,
      violetas: Number(qualityRecord.violetas),
      humedad: Number(qualityRecord.humedad),
      moho: Number(qualityRecord.moho),
      created_by: qualityRecord.createdBy,
      updated_by: qualityRecord.updatedBy,
      created_at: qualityRecord.createdAt?.toISOString(),
      updated_at: qualityRecord.updatedAt?.toISOString(),
    };

    return { success: true, data: quality || null };
  } catch (error: any) {
    console.error("Error in getQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Get quality evaluation with full reception details
 */
export async function getQualityEvaluationWithReception(
  recepcionId: string,
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
      .from(calidadCafe)
      .where(eq(calidadCafe.recepcionId, recepcionId))
      .limit(1);

    let quality: CalidadCafe | undefined;
    if (qualityData.length > 0) {
      const qualityRecord = qualityData[0];
      quality = {
        id: qualityRecord.id,
        recepcion_id: qualityRecord.recepcionId,
        violetas: Number(qualityRecord.violetas),
        humedad: Number(qualityRecord.humedad),
        moho: Number(qualityRecord.moho),
        created_by: qualityRecord.createdBy,
        updated_by: qualityRecord.updatedBy,
        created_at: qualityRecord.createdAt?.toISOString(),
        updated_at: qualityRecord.updatedAt?.toISOString(),
      };
    }

    // Get user details for created_by and updated_by
    let createdByUser = { id: '', username: '' };
    let updatedByUser = { id: '', username: '' };

    if (quality) {
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
      fruit_type: reception.fruitType,
      fruit_subtype: reception.fruitSubtype,
      total_containers: Number(reception.totalContainers),
      total_weight: Number(reception.totalWeight),
      status: reception.status,
      created_at: reception.createdAt?.toISOString() || '',
    };

    return {
      success: true,
      data: {
        quality: quality || null,
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
