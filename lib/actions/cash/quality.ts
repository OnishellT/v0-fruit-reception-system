"use server";

import { db } from "@/lib/db";
import { cashQualityThresholds, cashFruitTypes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import type { CashQualityThreshold } from "@/lib/db/schema";
import {
  CreateQualityThresholdSchema,
  UpdateQualityThresholdSchema,
  DeleteQualityThresholdSchema,
  GetQualityThresholdsSchema,
} from "@/lib/validations/pricing";

// ==============================
// QUALITY THRESHOLD MANAGEMENT
// ==============================

/**
 * Create a new quality threshold for a fruit type
 */
export async function createQualityThreshold(data: {
  fruit_type_id: number;
  metric: string;
  threshold_percent: number;
}): Promise<{ success: boolean; data?: CashQualityThreshold; error?: string }> {
  try {
    // Validate input
    const validation = CreateQualityThresholdSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
      };
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user is admin
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role !== "admin" || !userData[0].isActive) {
      return { success: false, error: "No tiene permisos de administrador" };
    }

    // Check if fruit type exists and is enabled
    const fruitTypeData = await db
      .select({ id: cashFruitTypes.id, enabled: cashFruitTypes.enabled })
      .from(cashFruitTypes)
      .where(eq(cashFruitTypes.id, data.fruit_type_id))
      .limit(1);

    if (fruitTypeData.length === 0) {
      return { success: false, error: "Tipo de fruta no encontrado" };
    }

    if (!fruitTypeData[0].enabled) {
      return { success: false, error: "Tipo de fruta no está habilitado" };
    }

    // Check if threshold already exists for this fruit type and metric
    const existingThreshold = await db
      .select()
      .from(cashQualityThresholds)
      .where(and(
        eq(cashQualityThresholds.fruitTypeId, data.fruit_type_id),
        eq(cashQualityThresholds.metric, data.metric)
      ))
      .limit(1);

    if (existingThreshold.length > 0) {
      return { success: false, error: "Ya existe un umbral para esta métrica y tipo de fruta" };
    }

    // Create the threshold
    const newThreshold = await db
      .insert(cashQualityThresholds)
      .values({
        fruitTypeId: data.fruit_type_id,
        metric: data.metric,
        thresholdPercent: data.threshold_percent.toString(),
        enabled: true,
      })
      .returning();

    if (newThreshold.length === 0) {
      return { success: false, error: "Error al crear el umbral de calidad" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/quality");

    return { success: true, data: newThreshold[0] };
  } catch (error) {
    console.error("Unexpected error creating quality threshold:", error);
    return {
      success: false,
      error: "Error inesperado al crear el umbral de calidad",
    };
  }
}

/**
 * Update an existing quality threshold
 */
export async function updateQualityThreshold(data: {
  id: number;
  threshold_percent?: number;
  enabled?: boolean;
}): Promise<{ success: boolean; data?: CashQualityThreshold; error?: string }> {
  try {
    // Validate input
    const validation = UpdateQualityThresholdSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
      };
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user is admin
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role !== "admin" || !userData[0].isActive) {
      return { success: false, error: "No tiene permisos de administrador" };
    }

    // Check if threshold exists
    const existingThreshold = await db
      .select()
      .from(cashQualityThresholds)
      .where(eq(cashQualityThresholds.id, data.id))
      .limit(1);

    if (existingThreshold.length === 0) {
      return { success: false, error: "Umbral de calidad no encontrado" };
    }

    // Prepare update data
    const updateData: any = {};

    if (data.threshold_percent !== undefined) {
      updateData.thresholdPercent = data.threshold_percent.toString();
    }

    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled;
    }

    // Update the threshold
    const updatedThreshold = await db
      .update(cashQualityThresholds)
      .set(updateData)
      .where(eq(cashQualityThresholds.id, data.id))
      .returning();

    if (updatedThreshold.length === 0) {
      return { success: false, error: "Error al actualizar el umbral de calidad" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/quality");

    return { success: true, data: updatedThreshold[0] };
  } catch (error) {
    console.error("Unexpected error updating quality threshold:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar el umbral de calidad",
    };
  }
}

/**
 * Delete a quality threshold
 */
export async function deleteQualityThreshold(data: {
  id: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = DeleteQualityThresholdSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
      };
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user is admin
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role !== "admin" || !userData[0].isActive) {
      return { success: false, error: "No tiene permisos de administrador" };
    }

    // Check if threshold exists
    const existingThreshold = await db
      .select()
      .from(cashQualityThresholds)
      .where(eq(cashQualityThresholds.id, data.id))
      .limit(1);

    if (existingThreshold.length === 0) {
      return { success: false, error: "Umbral de calidad no encontrado" };
    }

    // Delete the threshold
    await db
      .delete(cashQualityThresholds)
      .where(eq(cashQualityThresholds.id, data.id));

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/quality");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting quality threshold:", error);
    return {
      success: false,
      error: "Error inesperado al eliminar el umbral de calidad",
    };
  }
}

/**
 * Get quality thresholds with optional filtering
 */
export async function getQualityThresholds(data?: {
  fruit_type_id?: number;
  enabled_only?: boolean;
}): Promise<{ success: boolean; data?: CashQualityThreshold[]; error?: string }> {
  try {
    // Validate input if provided
    if (data) {
      const validation = GetQualityThresholdsSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.error.message}`,
        };
      }
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Build query conditions
    const conditions = [];

    if (data?.fruit_type_id) {
      conditions.push(eq(cashQualityThresholds.fruitTypeId, data.fruit_type_id));
    }

    if (data?.enabled_only !== false) { // Default to true if not specified
      conditions.push(eq(cashQualityThresholds.enabled, true));
    }

    // Query thresholds with fruit type information
    const thresholdsData = await db
      .select({
        id: cashQualityThresholds.id,
        fruitTypeId: cashQualityThresholds.fruitTypeId,
        metric: cashQualityThresholds.metric,
        thresholdPercent: cashQualityThresholds.thresholdPercent,
        enabled: cashQualityThresholds.enabled,
        createdAt: cashQualityThresholds.createdAt,
        fruitType: {
          code: cashFruitTypes.code,
          name: cashFruitTypes.name,
        },
      })
      .from(cashQualityThresholds)
      .innerJoin(cashFruitTypes, eq(cashQualityThresholds.fruitTypeId, cashFruitTypes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cashQualityThresholds.fruitTypeId, cashQualityThresholds.metric);

    // Transform the data to match expected format
    const thresholds = thresholdsData.map(threshold => ({
      id: threshold.id,
      fruitTypeId: threshold.fruitTypeId,
      metric: threshold.metric,
      thresholdPercent: threshold.thresholdPercent,
      enabled: threshold.enabled,
      createdAt: threshold.createdAt,
      fruitType: threshold.fruitType,
    }));

    return { success: true, data: thresholds as CashQualityThreshold[] };
  } catch (error) {
    console.error("Unexpected error getting quality thresholds:", error);
    return {
      success: false,
      error: "Error inesperado al obtener los umbrales de calidad",
    };
  }
}