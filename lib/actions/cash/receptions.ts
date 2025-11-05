"use server";

import { db } from "@/lib/db";
import { cashReceptions, cashCustomers, cashFruitTypes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { eq, and, desc, gte, lte, like, or } from "drizzle-orm";
import type { CashReception } from "@/lib/db/schema";
import {
  CreateCashReceptionSchema,
  UpdateCashReceptionSchema,
  DeleteCashReceptionSchema,
  GetCashReceptionsSchema,
} from "@/lib/validations/pricing";
import { getPriceForReception, validatePriceExists } from "./prices";
import { computeCashDiscounts, validateDiscountInputs } from "@/lib/utils/discounts";
import { getQualityThresholds } from "./quality";

/**
 * Calculate weight discounts for cash reception
 */
export async function calculateCashDiscounts(data: {
  fruit_type_id: number;
  total_weight: number;
  quality_data: { humedad?: number; moho?: number; violetas?: number };
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Get quality thresholds for this fruit type
    const thresholdsResult = await getQualityThresholds({
      fruit_type_id: data.fruit_type_id,
      enabled_only: true,
    });

    if (!thresholdsResult.success || !thresholdsResult.data) {
      return { success: false, error: "No se pudieron obtener los umbrales de calidad" };
    }

    // Transform thresholds to expected format
    const thresholds = thresholdsResult.data.map(threshold => ({
      fruitTypeId: threshold.fruitTypeId,
      metric: threshold.metric.toLowerCase(),
      thresholdPercent: parseFloat(threshold.thresholdPercent),
      enabled: threshold.enabled,
    }));

    // Validate inputs
    const validation = validateDiscountInputs(data.total_weight, thresholds, data.quality_data);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(", ") };
    }

    // Calculate discounts
    const discountResult = computeCashDiscounts(data.total_weight, thresholds, data.quality_data);

    return {
      success: true,
      data: {
        total_peso_original: data.total_weight,
        total_peso_descuento: discountResult.discountWeightKg,
        total_peso_final: discountResult.finalKg,
        combinedPercent: discountResult.combinedPercent,
        breakdown: discountResult.breakdown,
        calculation_timestamp: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error("Error calculating cash discounts:", error);
    return { success: false, error: "Error al calcular descuentos" };
  }
}

// ==============================
// CASH RECEPTION MANAGEMENT
// ==============================

/**
 * Create a new cash reception with automatic pricing and discount calculation
 */
export async function createCashReception(data: {
  fruit_type_id: number;
  customer_id: number;
  reception_date: string;
  containers_count: number;
  total_weight_kg_original: number;
  calidad_humedad?: number;
  calidad_moho?: number;
  calidad_violetas?: number;
}): Promise<{ success: boolean; data?: CashReception; error?: string }> {
  try {
    // Validate input
    const validation = CreateCashReceptionSchema.safeParse(data);
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

    // Check if user has permission (admin or operator)
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role === "viewer" || !userData[0].isActive) {
      return { success: false, error: "No tiene permisos para crear recepciones" };
    }

    // Validate that customer exists
    const customerData = await db
      .select()
      .from(cashCustomers)
      .where(eq(cashCustomers.id, data.customer_id))
      .limit(1);

    if (customerData.length === 0) {
      return { success: false, error: "Cliente no encontrado" };
    }

    // Validate that fruit type exists and is enabled
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

    // Validate that a price exists for this fruit type and date
    const priceValidation = await validatePriceExists({
      fruit_type_id: data.fruit_type_id,
      reception_date: data.reception_date,
    });

    if (!priceValidation.has_price) {
      return { success: false, error: "No hay precio activo para esta fecha y tipo de fruta" };
    }

    // Get the active price
    const priceResult = await getPriceForReception({
      fruit_type_id: data.fruit_type_id,
      reception_date: data.reception_date,
    });

    if (!priceResult.success || !priceResult.data) {
      return { success: false, error: "Error al obtener el precio" };
    }

    const pricePerKg = priceResult.data.price_per_kg;

    // Calculate discounts based on quality metrics
    const qualityData = {
      humedad: data.calidad_humedad || 0,
      moho: data.calidad_moho || 0,
      violetas: data.calidad_violetas || 0,
    };

    const discountResult = await calculateCashDiscounts({
      fruit_type_id: data.fruit_type_id,
      total_weight: data.total_weight_kg_original,
      quality_data: qualityData,
    });

    if (!discountResult.success || !discountResult.data) {
      return { success: false, error: discountResult.error || "Error al calcular descuentos" };
    }

    const discountData = discountResult.data;

    // Calculate final amounts
    const grossAmount = data.total_weight_kg_original * pricePerKg;
    const netAmount = discountData.total_peso_final * pricePerKg;

    // Create the reception
    const newReception = await db
      .insert(cashReceptions)
      .values({
        fruitTypeId: data.fruit_type_id,
        customerId: data.customer_id,
        receptionDate: new Date(data.reception_date),
        containersCount: data.containers_count,
        totalWeightKgOriginal: data.total_weight_kg_original.toString(),
        pricePerKgSnapshot: pricePerKg.toString(),
        calidadHumedad: data.calidad_humedad?.toString(),
        calidadMoho: data.calidad_moho?.toString(),
        calidadVioletas: data.calidad_violetas?.toString(),
        discountPercentTotal: discountData.combinedPercent.toString(),
        discountWeightKg: discountData.total_peso_descuento.toString(),
        totalWeightKgFinal: discountData.total_peso_final.toString(),
        grossAmount: grossAmount.toString(),
        netAmount: netAmount.toString(),
        discountBreakdown: discountData.breakdown,
        createdBy: session.id,
      })
      .returning();

    if (newReception.length === 0) {
      return { success: false, error: "Error al crear la recepción" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/receptions");

    return { success: true, data: newReception[0] };
  } catch (error) {
    console.error("Unexpected error creating cash reception:", error);
    return {
      success: false,
      error: "Error inesperado al crear la recepción",
    };
  }
}

/**
 * Update an existing cash reception
 */
export async function updateCashReception(data: {
  id: number;
  containers_count?: number;
  total_weight_kg_original?: number;
  calidad_humedad?: number;
  calidad_moho?: number;
  calidad_violetas?: number;
}): Promise<{ success: boolean; data?: CashReception; error?: string }> {
  try {
    // Validate input
    const validation = UpdateCashReceptionSchema.safeParse(data);
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

    // Check if user has permission (admin or operator)
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role === "viewer" || !userData[0].isActive) {
      return { success: false, error: "No tiene permisos para actualizar recepciones" };
    }

    // Check if reception exists
    const existingReception = await db
      .select()
      .from(cashReceptions)
      .where(eq(cashReceptions.id, data.id))
      .limit(1);

    if (existingReception.length === 0) {
      return { success: false, error: "Recepción no encontrada" };
    }

    const reception = existingReception[0];

    // Prepare update data
    const updateData: any = {};

    if (data.containers_count !== undefined) {
      updateData.containersCount = data.containers_count;
    }

    // If weight or quality metrics are being updated, recalculate discounts
    if (data.total_weight_kg_original !== undefined ||
        data.calidad_humedad !== undefined ||
        data.calidad_moho !== undefined ||
        data.calidad_violetas !== undefined) {

      const weight = data.total_weight_kg_original !== undefined
        ? data.total_weight_kg_original
        : parseFloat(reception.totalWeightKgOriginal);

      const qualityData = {
        humedad: data.calidad_humedad !== undefined ? data.calidad_humedad : (reception.calidadHumedad ? parseFloat(reception.calidadHumedad) : 0),
        moho: data.calidad_moho !== undefined ? data.calidad_moho : (reception.calidadMoho ? parseFloat(reception.calidadMoho) : 0),
        violetas: data.calidad_violetas !== undefined ? data.calidad_violetas : (reception.calidadVioletas ? parseFloat(reception.calidadVioletas) : 0),
      };

      const discountResult = await calculateCashDiscounts({
        fruit_type_id: reception.fruitTypeId,
        total_weight: weight,
        quality_data: qualityData,
      });

      if (!discountResult.success || !discountResult.data) {
        return { success: false, error: discountResult.error || "Error al recalcular descuentos" };
      }

      const discountData = discountResult.data;
      const pricePerKg = parseFloat(reception.pricePerKgSnapshot);

      updateData.totalWeightKgOriginal = weight.toString();
      updateData.calidadHumedad = qualityData.humedad.toString();
      updateData.calidadMoho = qualityData.moho.toString();
      updateData.calidadVioletas = qualityData.violetas.toString();
      updateData.discountPercentTotal = discountData.combinedPercent.toString();
      updateData.discountWeightKg = discountData.total_peso_descuento.toString();
      updateData.totalWeightKgFinal = discountData.total_peso_final.toString();
      updateData.grossAmount = (weight * pricePerKg).toString();
      updateData.netAmount = (discountData.total_peso_final * pricePerKg).toString();
      updateData.discountBreakdown = discountData.breakdown;
    }

    // Update the reception
    const updatedReception = await db
      .update(cashReceptions)
      .set(updateData)
      .where(eq(cashReceptions.id, data.id))
      .returning();

    if (updatedReception.length === 0) {
      return { success: false, error: "Error al actualizar la recepción" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/receptions");
    revalidatePath(`/dashboard/cash-pos/receptions/${data.id}`);

    return { success: true, data: updatedReception[0] };
  } catch (error) {
    console.error("Unexpected error updating cash reception:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar la recepción",
    };
  }
}

/**
 * Delete a cash reception
 */
export async function deleteCashReception(data: {
  id: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = DeleteCashReceptionSchema.safeParse(data);
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

    // Check if user has permission (admin only for deletions)
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role !== "admin" || !userData[0].isActive) {
      return { success: false, error: "Solo administradores pueden eliminar recepciones" };
    }

    // Check if reception exists
    const existingReception = await db
      .select()
      .from(cashReceptions)
      .where(eq(cashReceptions.id, data.id))
      .limit(1);

    if (existingReception.length === 0) {
      return { success: false, error: "Recepción no encontrada" };
    }

    // Delete the reception
    await db
      .delete(cashReceptions)
      .where(eq(cashReceptions.id, data.id));

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/receptions");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting cash reception:", error);
    return {
      success: false,
      error: "Error inesperado al eliminar la recepción",
    };
  }
}

/**
 * Get cash receptions with filtering and pagination
 */
export async function getCashReceptions(data?: {
  fruit_type_id?: number;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: CashReception[]; total?: number; error?: string }> {
  try {
    // Validate input if provided
    if (data) {
      const validation = GetCashReceptionsSchema.safeParse(data);
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
      conditions.push(eq(cashReceptions.fruitTypeId, data.fruit_type_id));
    }

    if (data?.customer_id) {
      conditions.push(eq(cashReceptions.customerId, data.customer_id));
    }

    if (data?.start_date) {
      conditions.push(gte(cashReceptions.receptionDate, new Date(data.start_date)));
    }

    if (data?.end_date) {
      conditions.push(lte(cashReceptions.receptionDate, new Date(data.end_date)));
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: cashReceptions.id })
      .from(cashReceptions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult.length;

    // Query receptions with related data
    const receptionsData = await db
      .select({
        id: cashReceptions.id,
        fruitTypeId: cashReceptions.fruitTypeId,
        customerId: cashReceptions.customerId,
        receptionDate: cashReceptions.receptionDate,
        containersCount: cashReceptions.containersCount,
        totalWeightKgOriginal: cashReceptions.totalWeightKgOriginal,
        pricePerKgSnapshot: cashReceptions.pricePerKgSnapshot,
        calidadHumedad: cashReceptions.calidadHumedad,
        calidadMoho: cashReceptions.calidadMoho,
        calidadVioletas: cashReceptions.calidadVioletas,
        discountPercentTotal: cashReceptions.discountPercentTotal,
        discountWeightKg: cashReceptions.discountWeightKg,
        totalWeightKgFinal: cashReceptions.totalWeightKgFinal,
        grossAmount: cashReceptions.grossAmount,
        netAmount: cashReceptions.netAmount,
        discountBreakdown: cashReceptions.discountBreakdown,
        createdAt: cashReceptions.createdAt,
        createdBy: cashReceptions.createdBy,
        fruitType: {
          code: cashFruitTypes.code,
          name: cashFruitTypes.name,
        },
        customer: {
          name: cashCustomers.name,
          nationalId: cashCustomers.nationalId,
        },
      })
      .from(cashReceptions)
      .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
      .innerJoin(cashCustomers, eq(cashReceptions.customerId, cashCustomers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(cashReceptions.receptionDate), desc(cashReceptions.createdAt))
      .limit(data?.limit || 50)
      .offset(data?.offset || 0);

    return { success: true, data: receptionsData as CashReception[], total };
  } catch (error) {
    console.error("Unexpected error getting cash receptions:", error);
    return {
      success: false,
      error: "Error inesperado al obtener las recepciones",
    };
  }
}

/**
 * Get a single cash reception by ID with full details
 */
export async function getCashReception(id: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Query reception with related data
    const receptionData = await db
      .select({
        id: cashReceptions.id,
        fruitTypeId: cashReceptions.fruitTypeId,
        customerId: cashReceptions.customerId,
        receptionDate: cashReceptions.receptionDate,
        containersCount: cashReceptions.containersCount,
        totalWeightKgOriginal: cashReceptions.totalWeightKgOriginal,
        pricePerKgSnapshot: cashReceptions.pricePerKgSnapshot,
        calidadHumedad: cashReceptions.calidadHumedad,
        calidadMoho: cashReceptions.calidadMoho,
        calidadVioletas: cashReceptions.calidadVioletas,
        discountPercentTotal: cashReceptions.discountPercentTotal,
        discountWeightKg: cashReceptions.discountWeightKg,
        totalWeightKgFinal: cashReceptions.totalWeightKgFinal,
        grossAmount: cashReceptions.grossAmount,
        netAmount: cashReceptions.netAmount,
        discountBreakdown: cashReceptions.discountBreakdown,
        createdAt: cashReceptions.createdAt,
        createdBy: cashReceptions.createdBy,
        fruitType: {
          code: cashFruitTypes.code,
          name: cashFruitTypes.name,
        },
        customer: {
          name: cashCustomers.name,
          nationalId: cashCustomers.nationalId,
        },
      })
      .from(cashReceptions)
      .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
      .innerJoin(cashCustomers, eq(cashReceptions.customerId, cashCustomers.id))
      .where(eq(cashReceptions.id, id))
      .limit(1);

    if (receptionData.length === 0) {
      return { success: false, error: "Recepción no encontrada" };
    }

    return { success: true, data: receptionData[0] };
  } catch (error) {
    console.error("Unexpected error getting cash reception:", error);
    return {
      success: false,
      error: "Error inesperado al obtener la recepción",
    };
  }
}