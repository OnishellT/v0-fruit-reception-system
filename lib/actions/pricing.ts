"use server";

import { db } from "@/lib/db";
import { pricingRules, discountThresholds, fruitTypes, users, pricingCalculations, weightDiscountCalculations, desgloseDescuentos, receptions, auditLogs, qualityEvaluations, laboratorySamples, dailyPrices } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import type {
  PricingRule,
  DiscountThreshold,
  PricingRuleWithThresholds,
  UpdatePricingRuleData,
  CreateDiscountThresholdData,
  UpdateDiscountThresholdData,
  PricingRuleResponse,
  DiscountThresholdResponse,
  PricingCalculationPreview,
  PricingCalculationPreviewResponse,
  CalculateReceptionPricingData,
  SaveReceptionWithPricingData,
  WeightDiscountRequest,
  WeightDiscountResponse,
  WeightDiscountCalculation,
  AdminDiscountOverrideRequest,
} from "@/lib/types/pricing";
import {
  UpdatePricingRuleSchema,
  CreateDiscountThresholdSchema,
  UpdateDiscountThresholdSchema,
  CalculateReceptionPricingSchema,
  SaveReceptionWithPricingSchema,
  WeightDiscountRequestSchema,
  AdminDiscountOverrideRequestSchema,
} from "@/lib/validations/pricing";
import {
  calculatePricing,
  validatePricingCalculation,
  createPricingCalculationData,
  roundToTwoDecimals,
  calculateWeightDiscounts,
  validateWeightDiscountInputs,
  createDiscountBreakdownForStorage,
  combineQualityMetrics,
} from "@/lib/utils/pricing";

// ==============================
// DAILY PRICES
// ==============================

/**
 * Get daily price for a specific fruit type and date
 */
export async function getDailyPrice(fruitTypeId: string, priceDate: string) {
  try {
    console.log("🔍 getDailyPrice called with:", { fruitTypeId, priceDate });

    // Try the Drizzle query first
    const priceData = await db
      .select()
      .from(dailyPrices)
      .where(
        and(
          eq(dailyPrices.fruitTypeId, fruitTypeId),
          eq(dailyPrices.priceDate, priceDate),
          eq(dailyPrices.active, true)
        )
      )
      .limit(1);

    console.log("📊 Daily price query result:", priceData);

    if (priceData.length === 0) {
      console.log("⚠️ No daily price found for:", { fruitTypeId, priceDate });
      return null;
    }

    const result = {
      id: priceData[0].id,
      fruitTypeId: priceData[0].fruitTypeId,
      priceDate: priceData[0].priceDate,
      pricePerKg: parseFloat(priceData[0].pricePerKg.toString()),
      active: priceData[0].active,
    };

    console.log("✅ Daily price found:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting daily price:", error);
    // Don't throw the error, just return null to prevent breaking the reception creation
    return null;
  }
}

// ==============================
// PRICING RULES
// ==============================

/**
 * Get pricing rules for a specific fruit type
 */
export async function getPricingRules(
  fruitTypeId: string,
): Promise<PricingRuleResponse> {
  try {
    console.log("🔍 getPricingRules called with fruitTypeId:", fruitTypeId);

    // First get the fruit type name from the ID
    const fruitTypeData = await db
      .select({ type: fruitTypes.type })
      .from(fruitTypes)
      .where(eq(fruitTypes.id, fruitTypeId))
      .limit(1);

    if (fruitTypeData.length === 0) {
      console.error("Fruit type not found");
      return { success: false, error: "Error al obtener el tipo de fruta" };
    }

    const fruitType = fruitTypeData[0];
    console.log("📋 Found fruit type:", fruitType.type);

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
      console.log("❌ No pricing rule found for fruit type:", fruitType.type);
      return { success: false, error: "Reglas de precios no encontradas" };
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

    console.log("✅ Found pricing rule with thresholds:", {
      pricingRuleId: pricingRule.id,
      fruitType: pricingRule.fruitType,
      qualityBasedPricingEnabled: pricingRule.qualityBasedPricingEnabled,
      thresholdCount: discountThresholdsArray.length,
    });

    return { success: true, data: result as any };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al obtener las reglas de precios",
    };
  }
}

/**
 * Update pricing rules (enable/disable quality-based pricing)
 */
export async function updatePricingRules(
  data: UpdatePricingRuleData,
): Promise<PricingRuleResponse> {
  try {
    // Validate input
    const validation = UpdatePricingRuleSchema.safeParse(data);
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

    // Update pricing rule
    const updatedRule = await db
      .update(pricingRules)
      .set({
        qualityBasedPricingEnabled: data.quality_based_pricing_enabled,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(pricingRules.fruitType, data.fruit_type))
      .returning();

    if (updatedRule.length === 0) {
      console.error("Error updating pricing rules: no rows updated");
      return {
        success: false,
        error: "Error al actualizar las reglas de precios",
      };
    }

    // Log the pricing change (using audit_logs instead of pricing_changes)
    try {
      await db.insert(auditLogs).values({
        userId: session.id,
        action: "pricing_rule_update",
        tableName: "pricing_rules",
        recordId: updatedRule[0].id,
        newValues: {
          quality_based_pricing_enabled: data.quality_based_pricing_enabled,
        },
      });
    } catch (logError: any) {
      // Don't fail the whole operation if logging fails
      console.warn("Warning: Failed to log pricing change:", logError);
    }

    // Revalidate paths
    revalidatePath("/dashboard/pricing");

    return { success: true, data: updatedRule[0] as any };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar las reglas de precios",
    };
  }
}

// ==============================
// DISCOUNT THRESHOLDS
// ==============================

/**
 * Get all discount thresholds for a fruit type
 */
export async function getAllDiscountThresholds(
  fruitType: string,
): Promise<{ success: boolean; data?: DiscountThreshold[]; error?: string }> {
  try {
    // Get pricing rule for the fruit type
    const pricingRuleData = await db
      .select({ id: pricingRules.id })
      .from(pricingRules)
      .where(eq(pricingRules.fruitType, fruitType))
      .limit(1);

    if (pricingRuleData.length === 0) {
      return { success: false, error: "Regla de precios no encontrada" };
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

    return { success: true, data: thresholds as DiscountThreshold[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al obtener los umbrales",
    };
  }
}

/**
 * Create a new discount threshold
 */
export async function createDiscountThreshold(
  data: CreateDiscountThresholdData,
): Promise<DiscountThresholdResponse> {
  try {
    // Validate input
    const validation = CreateDiscountThresholdSchema.safeParse(data);
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

    // Create threshold
    const newThreshold = await db
      .insert(discountThresholds)
      .values({
        pricingRuleId: data.pricing_rule_id,
        qualityMetric: data.quality_metric,
        limitValue: data.limit_value.toString(),
        createdBy: session.id,
      })
      .returning();

    if (newThreshold.length === 0) {
      console.error("Error creating discount threshold: no rows returned");
      return { success: false, error: "Error al crear el umbral de descuento" };
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

    // Revalidate paths
    revalidatePath("/dashboard/pricing");

    return { success: true, data: result as DiscountThreshold };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Error inesperado al crear el umbral" };
  }
}

/**
 * Update an existing discount threshold
 */
export async function updateDiscountThreshold(
  data: UpdateDiscountThresholdData,
): Promise<DiscountThresholdResponse> {
  try {
    // Validate input
    const validation = UpdateDiscountThresholdSchema.safeParse(data);
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

    console.log("🔄 Updating discount threshold:", data);

    // Update threshold
    const updatedThreshold = await db
      .update(discountThresholds)
      .set({
        limitValue: data.limit_value.toString(),
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(discountThresholds.id, data.id))
      .returning();

    console.log("📊 Update result:", updatedThreshold);

    if (updatedThreshold.length === 0) {
      console.error("No threshold returned from update");
      return { success: false, error: "No se pudo actualizar el umbral" };
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

    // Revalidate paths
    revalidatePath("/dashboard/pricing");

    return { success: true, data: result as DiscountThreshold };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar el umbral",
    };
  }
}

/**
 * Delete a discount threshold
 */
export async function deleteDiscountThreshold(
  id: string,
): Promise<{ success: boolean; error?: string; deletedId?: string }> {
  try {
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

    // Delete threshold
    await db
      .delete(discountThresholds)
      .where(eq(discountThresholds.id, id));

    // Revalidate paths
    revalidatePath("/dashboard/pricing");

    return { success: true, deletedId: id };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Error inesperado al eliminar el umbral" };
  }
}

// ==============================
// PRICING CALCULATIONS
// ==============================

/**
 * Calculate reception pricing (preview without saving)
 */
export async function calculateReceptionPricing(
  data: CalculateReceptionPricingData,
): Promise<PricingCalculationPreviewResponse> {
  try {
    // Validate input
    const validation = CalculateReceptionPricingSchema.safeParse(data);
    if (!validation.success) {
      return { can_calculate: false, errors: [validation.error.message] };
    }

    // Get fruit type ID from fruit type name
    const fruitTypeResult = await db
      .select({ id: fruitTypes.id })
      .from(fruitTypes)
      .where(eq(fruitTypes.type, data.fruit_type))
      .limit(1);

    if (fruitTypeResult.length === 0) {
      return {
        can_calculate: false,
        errors: ["Tipo de fruta no encontrado"],
      };
    }

    const fruitTypeId = fruitTypeResult[0].id;

    // Get daily price for today (since reception_date is not in the interface)
    const today = new Date().toISOString().split('T')[0];
    const dailyPrice = await getDailyPrice(fruitTypeId, today);

    if (!dailyPrice) {
      return {
        can_calculate: false,
        errors: ["No hay precio diario disponible para este tipo de fruta en la fecha seleccionada"],
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
        errors: ["No hay reglas de precios configuradas para este tipo de fruta"],
      };
    }

    const pricingRule = thresholdsData[0].pricingRule;

    // Transform thresholds to expected format
    const thresholds = thresholdsData.map(item => ({
      id: item.threshold.id,
      pricing_rule_id: item.threshold.pricingRuleId,
      quality_metric: item.threshold.qualityMetric as "Violetas" | "Humedad" | "Moho",
      limit_value: Number(item.threshold.limitValue),
      created_at: item.threshold.createdAt?.toISOString(),
      updated_at: item.threshold.updatedAt?.toISOString(),
      created_by: item.threshold.createdBy || undefined,
      updated_by: item.threshold.updatedBy || undefined,
    }));

    // For now, use the provided quality_evaluation
    // In the future, this could be extended to accept combined metrics from multiple sources
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

    // Calculate weight discounts first to get final weight
    const weightDiscountResult = calculateWeightDiscounts(
      data.total_weight,
      {
        moho: combinedQualityMetrics.find(m => m.metric === 'Moho')?.value || 0,
        humedad: combinedQualityMetrics.find(m => m.metric === 'Humedad')?.value || 0,
        violetas: combinedQualityMetrics.find(m => m.metric === 'Violetas')?.value || 0,
      },
      thresholds
    );

    // Calculate pricing using final weight (after quality discounts)
    const preview = calculatePricing(
      data.base_price_per_kg,
      weightDiscountResult.final_weight,
      [], // No quality metrics for price calculation
      [], // No thresholds for price calculation
    );

    return { can_calculate: true, data: preview };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      can_calculate: false,
      errors: ["Error inesperado al calcular precios"],
    };
  }
}

/**
 * Save reception with automatic pricing calculation
 */
export async function saveReceptionWithPricing(
  data: SaveReceptionWithPricingData,
): Promise<{
  success: boolean;
  error?: string;
  pricingCalculationId?: string;
}> {
  try {
    // Validate input
    const validation = SaveReceptionWithPricingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Get pricing rules and thresholds
    const pricingRuleData = await db
      .select()
      .from(pricingRules)
      .where(eq(pricingRules.fruitType, data.fruit_type))
      .limit(1);

    if (pricingRuleData.length === 0) {
      return { success: false, error: "Reglas de precios no encontradas" };
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
      quality_metric: threshold.qualityMetric as "Violetas" | "Humedad" | "Moho",
      limit_value: Number(threshold.limitValue),
      created_at: threshold.createdAt?.toISOString(),
      updated_at: threshold.updatedAt?.toISOString(),
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
      return { success: false, error: validationResult.errors.join(", ") };
    }

    // Calculate weight discounts first to get final weight
    const weightDiscountResult = calculateWeightDiscounts(
      data.total_weight,
      {
        moho: data.quality_evaluation.find(m => m.metric === 'Moho')?.value || 0,
        humedad: data.quality_evaluation.find(m => m.metric === 'Humedad')?.value || 0,
        violetas: data.quality_evaluation.find(m => m.metric === 'Violetas')?.value || 0,
      },
      thresholds
    );

    // Calculate pricing using final weight (after quality discounts)
    const preview = calculatePricing(
      data.base_price_per_kg,
      weightDiscountResult.final_weight,
      [], // No quality metrics for price calculation
      [], // No thresholds for price calculation
    );

    // Create pricing calculation data
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
        createdBy: session.id,
      })
      .returning();

    if (pricingCalculation.length === 0) {
      console.error("Error saving pricing calculation: no rows returned");
      return {
        success: false,
        error: "Error al guardar el cálculo de precios",
      };
    }

    // Revalidate paths
    revalidatePath("/dashboard/receptions");
    revalidatePath("/dashboard/pricing");

    return { success: true, pricingCalculationId: pricingCalculation[0].id };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al guardar el cálculo de precios",
    };
  }
}

// ==============================
// WEIGHT DISCOUNT CALCULATIONS
// ==============================

/**
 * Calculate weight discounts for a reception
 */
export async function calculateWeightDiscountsAction(
  data: WeightDiscountRequest,
): Promise<WeightDiscountResponse> {
  try {
    // Validate input
    const validation = WeightDiscountRequestSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
        details: validation.error.errors?.map((e) => e.message) || [],
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Get fruit type name from ID
    const fruitTypeData = await db
      .select({ type: fruitTypes.type })
      .from(fruitTypes)
      .where(eq(fruitTypes.id, data.fruit_type_id))
      .limit(1);

    if (fruitTypeData.length === 0) {
      return { success: false, error: "Error al obtener el tipo de fruta" };
    }

    const fruitType = fruitTypeData[0];

    // Get discount thresholds for the fruit type
    const thresholdsData = await db
      .select()
      .from(discountThresholds)
      .innerJoin(pricingRules, eq(discountThresholds.pricingRuleId, pricingRules.id))
      .where(and(
        eq(pricingRules.fruitType, fruitType.type),
        eq(pricingRules.qualityBasedPricingEnabled, true)
      ));

    if (thresholdsData.length === 0) {
      return {
        success: false,
        error:
          "No hay umbrales de descuento configurados para este tipo de fruta",
      };
    }

    // Transform thresholds to expected format
    const thresholds = thresholdsData.map(row => ({
      id: row.discount_thresholds.id,
      pricing_rule_id: row.discount_thresholds.pricingRuleId,
      quality_metric: row.discount_thresholds.qualityMetric as "Violetas" | "Humedad" | "Moho",
      limit_value: Number(row.discount_thresholds.limitValue),
      created_at: row.discount_thresholds.createdAt?.toISOString(),
      updated_at: row.discount_thresholds.updatedAt?.toISOString(),
      created_by: row.discount_thresholds.createdBy || undefined,
      updated_by: row.discount_thresholds.updatedBy || undefined,
    }));

    // Validate calculation inputs
    const validationInputs = validateWeightDiscountInputs(
      data.total_weight,
      data.quality_data,
      thresholds,
    );

    if (!validationInputs.isValid) {
      return {
        success: false,
        error: "Datos inválidos para cálculo",
        details: validationInputs.errors,
      };
    }

    // Calculate weight discounts
    const calculationResult = calculateWeightDiscounts(
      data.total_weight,
      data.quality_data,
      thresholds,
    );

    // Create response data structure
    const responseData: WeightDiscountCalculation = {
      reception_id: data.reception_id,
      total_peso_original: calculationResult.original_weight,
      total_peso_descuento: calculationResult.total_discount,
      total_peso_final: calculationResult.final_weight,
      breakdown: calculationResult.breakdowns.map((breakdown) => ({
        parametro: breakdown.parametro,
        umbral: breakdown.umbral,
        valor: breakdown.valor,
        porcentaje_descuento: breakdown.porcentaje_descuento,
        peso_descuento: breakdown.peso_descuento,
      })),
      calculation_timestamp: new Date().toISOString(),
      calculated_by: session.id,
    };

    return { success: true, data: responseData };
  } catch (error) {
    console.error("Unexpected error in weight discount calculation:", error);
    return {
      success: false,
      error: "Error inesperado al calcular descuentos de peso",
    };
  }
}

/**
 * Save weight discount calculation for a reception
 */
export async function saveWeightDiscountCalculation(
  data: WeightDiscountRequest,
): Promise<{ success: boolean; error?: string; calculationId?: string }> {
  console.log("🔧 saveWeightDiscountCalculation called with:", {
    reception_id: data.reception_id,
    total_weight: data.total_weight,
    quality_data: data.quality_data,
    fruit_type_id: data.fruit_type_id,
  });

  try {
    // Validate input
    const validation = WeightDiscountRequestSchema.safeParse(data);
    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.message);
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
      };
    }

    const session = await getSession();
    if (!session?.id) {
      console.error("❌ No user session");
      return { success: false, error: "No autorizado" };
    }

    // Save or update quality evaluation data
    // The database trigger will automatically handle discount calculation
    console.log("💾 Saving quality evaluation data...");
    await db
      .insert(qualityEvaluations)
      .values({
        recepcionId: data.reception_id,
        violetas: data.quality_data.violetas?.toString(),
        humedad: data.quality_data.humedad?.toString(),
        moho: data.quality_data.moho?.toString(),
        createdBy: session.id,
        updatedBy: session.id,
      })
      .onConflictDoUpdate({
        target: qualityEvaluations.recepcionId,
        set: {
          violetas: data.quality_data.violetas?.toString(),
          humedad: data.quality_data.humedad?.toString(),
          moho: data.quality_data.moho?.toString(),
          updatedBy: session.id,
          updatedAt: new Date(),
        },
      });

    console.log("✅ Quality evaluation saved successfully");

    // The database trigger `auto_apply_quality_discounts` will automatically:
    // 1. Calculate weight discounts
    // 2. Save discount breakdown to desglose_descuentos
    // 3. Update reception totals (total_peso_original, total_peso_descuento, total_peso_final)
    // 4. Update reception details with discounted weights

    // Calculate discounts for return value (preview purposes)
    const calculationResult = await calculateWeightDiscountsAction({
      ...data,
      fruit_type_id: data.fruit_type_id,
    });
    if (!calculationResult.success || !calculationResult.data) {
      return {
        success: false,
        error: calculationResult.error || "Error en cálculo de descuentos",
      };
    }

    console.log("💾 Discount calculation completed by trigger");

    // Log calculation for audit trail
    try {
      await db
        .insert(weightDiscountCalculations)
        .values({
          receptionId: data.reception_id,
          calculationData: calculationResult.data,
          createdBy: session.id,
        });

      console.log("✅ Weight discount calculation logged successfully");
    } catch (logError: any) {
      console.warn(
        "⚠️ Could not log weight discount calculation (table may not exist):",
        logError.message,
      );
      // Don't fail the operation if the logging table doesn't exist
    }

    // Revalidate paths
    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${data.reception_id}`);

    return { success: true, calculationId: data.reception_id };
  } catch (error) {
    console.error(
      "Unexpected error saving weight discount calculation:",
      error,
    );
    return {
      success: false,
      error: "Error inesperado al guardar cálculo de descuentos",
    };
  }
}

/**
 * Get discount breakdown for a reception
 */
export async function getDiscountBreakdown(
  receptionId: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user has access to this reception
    const receptionData = await db
      .select({ providerId: receptions.providerId })
      .from(receptions)
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (receptionData.length === 0) {
      return { success: false, error: "Recepción no encontrada" };
    }

    const reception = receptionData[0];

    // For now, skip provider access check and rely on RLS policies
    // TODO: Implement proper provider access checking with Drizzle
    // Check if user is admin
    const userData = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role !== "admin") {
      // TODO: Add proper provider access check
      return { success: false, error: "No tiene acceso a esta recepción" };
    }

    // Fetch discount breakdown
    const breakdownData = await db
      .select({
        parametro: desgloseDescuentos.parametro,
        umbral: desgloseDescuentos.umbral,
        valor: desgloseDescuentos.valor,
        porcentajeDescuento: desgloseDescuentos.porcentajeDescuento,
        pesoDescuento: desgloseDescuentos.pesoDescuento,
        createdAt: desgloseDescuentos.createdAt,
      })
      .from(desgloseDescuentos)
      .where(eq(desgloseDescuentos.recepcionId, receptionId))
      .orderBy(desgloseDescuentos.parametro);

    // Transform breakdown data
    const breakdown = breakdownData.map(item => ({
      parametro: item.parametro,
      umbral: Number(item.umbral),
      valor: Number(item.valor),
      porcentaje_descuento: Number(item.porcentajeDescuento),
      peso_descuento: Number(item.pesoDescuento),
      created_at: item.createdAt?.toISOString(),
    }));

    // Fetch reception weight fields and lab sample data
    const receptionWeightData = await db
      .select({
        totalPesoOriginal: receptions.totalPesoOriginal,
        totalPesoDescuento: receptions.totalPesoDescuento,
        totalPesoFinal: receptions.totalPesoFinal,
        labSampleWetWeight: receptions.labSampleWetWeight,
        labSampleDriedWeight: receptions.labSampleDriedWeight,
      })
      .from(receptions)
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (receptionWeightData.length === 0) {
      return {
        success: false,
        error: "Error al obtener datos de peso de recepción",
      };
    }

    const weightData = receptionWeightData[0];

    // Calculate total discount from breakdown
    const totalDiscountFromBreakdown = breakdown.reduce(
      (sum: number, item: any) => sum + (Number(item.peso_descuento) || 0),
      0,
    );

    // Calculate expected final weight
    const originalWeight = Number(weightData.totalPesoOriginal) || 0;
    const labWet = Number(weightData.labSampleWetWeight) || 0;
    const labDried = Number(weightData.labSampleDriedWeight) || 0;
    const labAdjustment = labDried - labWet;
    const expectedFinalWeight =
      originalWeight - totalDiscountFromBreakdown + labAdjustment;

    // Check if totals match breakdown
    const dbTotalDiscount = Number(weightData.totalPesoDescuento) || 0;
    const dbFinalWeight = Number(weightData.totalPesoFinal) || 0;

    const discountMismatch =
      Math.abs(dbTotalDiscount - totalDiscountFromBreakdown) > 0.01;
    const finalWeightMismatch =
      Math.abs(dbFinalWeight - expectedFinalWeight) > 0.01;

    if (discountMismatch || finalWeightMismatch) {
      console.warn("⚠️ Discount totals mismatch detected!", {
        receptionId,
        dbTotalDiscount,
        breakdownTotal: totalDiscountFromBreakdown,
        dbFinalWeight,
        expectedFinalWeight,
      });

      // Try to recalculate using database function
      // TODO: Implement RPC call with Drizzle or skip for now
      console.warn("⚠️ Recalculation not implemented yet");
    }

    const responseData = {
      reception_id: receptionId,
      total_peso_original: weightData.totalPesoOriginal,
      total_peso_descuento: weightData.totalPesoDescuento,
      total_peso_final: weightData.totalPesoFinal,
      lab_sample_wet_weight: weightData.labSampleWetWeight,
      lab_sample_dried_weight: weightData.labSampleDriedWeight,
      lab_adjustment: labAdjustment,
      breakdown: breakdown,
      breakdown_total: totalDiscountFromBreakdown,
      calculation_timestamp: breakdown[0]?.created_at || null,
      _debug: {
        discount_matched: !discountMismatch,
        final_weight_matched: !finalWeightMismatch,
      },
    };

    return { success: true, data: responseData };
  } catch (error) {
    console.error("Unexpected error fetching discount breakdown:", error);
    return {
      success: false,
      error: "Error inesperado al obtener desglose de descuentos",
    };
  }
}

/**
 * Admin override for weight discounts
 */
export async function adminOverrideWeightDiscounts(
  data: AdminDiscountOverrideRequest,
): Promise<WeightDiscountResponse> {
  try {
    // Validate input
    const validation = AdminDiscountOverrideRequestSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Datos inválidos: ${validation.error.message}`,
        details: validation.error.errors?.map((e) => e.message) || [],
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user is admin
    const userData = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (userData.length === 0 || userData[0].role !== "admin" || !userData[0].isActive) {
      return { success: false, error: "Requiere permisos de administrador" };
    }

    // Verify calculation consistency
    const expectedFinal = data.total_peso_original - data.total_peso_descuento;
    if (Math.abs(data.total_peso_final - expectedFinal) > 0.01) {
      return {
        success: false,
        error:
          "La suma de peso original y descuento debe igualar el peso final",
      };
    }

    // Update reception with admin override values
    await db
      .update(receptions)
      .set({
        totalPesoOriginal: data.total_peso_original.toString(),
        totalPesoDescuento: data.total_peso_descuento.toString(),
        totalPesoFinal: data.total_peso_final.toString(),
        updatedAt: new Date(),
      })
      .where(eq(receptions.id, data.reception_id));

    // Clear existing discount breakdown
    await db
      .delete(desgloseDescuentos)
      .where(eq(desgloseDescuentos.recepcionId, data.reception_id));

    // Insert new discount breakdown if provided
    if (data.breakdown && data.breakdown.length > 0) {
      const breakdownData = data.breakdown.map((breakdown) => ({
        recepcionId: data.reception_id,
        parametro: breakdown.parametro,
        umbral: breakdown.umbral.toString(),
        valor: breakdown.valor.toString(),
        porcentajeDescuento: breakdown.porcentaje_descuento.toString(),
        pesoDescuento: breakdown.peso_descuento.toString(),
        createdBy: session.id,
      }));

      await db
        .insert(desgloseDescuentos)
        .values(breakdownData);
    }

    // Log admin override (table may not exist, so wrap in try-catch)
    try {
      // Note: weight_discount_overrides table may not exist in schema yet
      console.warn("Admin override logging not implemented - table may not exist");
    } catch (logError: any) {
      console.warn("Warning: Failed to log admin override:", logError.message);
    }

    // Create response data
    const responseData: WeightDiscountCalculation = {
      reception_id: data.reception_id,
      total_peso_original: data.total_peso_original,
      total_peso_descuento: data.total_peso_descuento,
      total_peso_final: data.total_peso_final,
      breakdown: data.breakdown || [],
      calculation_timestamp: new Date().toISOString(),
      calculated_by: session.id,
    };

    // Revalidate paths
    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${data.reception_id}`);

    return { success: true, data: responseData };
  } catch (error) {
    console.error("Unexpected error in admin override:", error);
    return {
      success: false,
      error: "Error inesperado en anulación administrativa",
    };
  }
}
