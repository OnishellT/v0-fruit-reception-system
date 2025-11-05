"use server";

import { db } from "@/lib/db";
import {
  receptions,
  receptionDetails,
  fruitTypes,
  pricingRules,
  discountThresholds,
  pricingCalculations,
  auditLogs,
  dailyPrices
} from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { calculatePricing, validatePricingCalculation, calculateWeightDiscounts } from "@/lib/utils/pricing";
import type { QualityMetricValue, QualityEvaluationData } from "@/lib/types/pricing";
import { eq, and } from "drizzle-orm";

interface CreateReceptionWithPricingData {
  provider_id: string;
  driver_id: string;
  fruit_type_id: string;
  truck_plate: string;
  total_containers: number;
  notes?: string;
  details: Array<{
    fruit_type_id: string;
    quantity: number;
    weight_kg: number;
    line_number: number;
  }>;
  // Optional quality evaluation data
  quality_evaluation?: QualityMetricValue[];
  // Optional base price per kg (could be from a price table in the future)
  base_price_per_kg?: number;
}

export async function createReceptionWithPricing(data: CreateReceptionWithPricingData) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    // First, create the reception
    const newReception = await db
      .insert(receptions)
      .values({
        providerId: data.provider_id,
        driverId: data.driver_id,
        fruitTypeId: data.fruit_type_id,
        truckPlate: data.truck_plate,
        totalContainers: data.total_containers,
        notes: data.notes || null,
        createdBy: session.id,
      })
      .returning();

    if (newReception.length === 0) {
      throw new Error("Failed to create reception");
    }

    const reception = newReception[0];

    // Insert reception details
    if (data.details && data.details.length > 0) {
      const detailsWithReception = data.details.map((detail) => ({
        receptionId: reception.id,
        fruitTypeId: detail.fruit_type_id,
        quantity: detail.quantity,
        weightKg: detail.weight_kg.toString(),
        lineNumber: detail.line_number,
        originalWeight: detail.weight_kg.toString(),
        discountedWeight: detail.weight_kg.toString(),
        discountPercentage: "0",
      }));

      await db
        .insert(receptionDetails)
        .values(detailsWithReception);
    }

    // Calculate total weight from details
    const totalWeight = data.details.reduce((sum, detail) => sum + detail.weight_kg, 0);

    // If quality evaluation and base price are provided, calculate pricing
    let pricingCalculationId: string | null = null;
    if (data.quality_evaluation && data.quality_evaluation.length > 0 && data.base_price_per_kg) {
      try {
        // Get fruit type name
        const fruitTypeResult = await db
          .select({ type: fruitTypes.type })
          .from(fruitTypes)
          .where(eq(fruitTypes.id, data.fruit_type_id))
          .limit(1);

        if (fruitTypeResult.length > 0) {
          const fruitType = fruitTypeResult[0];

          // Get pricing rules and thresholds
          const pricingRuleResult = await db
            .select()
            .from(pricingRules)
            .where(eq(pricingRules.fruitType, fruitType.type))
            .limit(1);

          if (pricingRuleResult.length > 0) {
            const pricingRule = pricingRuleResult[0];

            const thresholdsResult = await db
              .select()
              .from(discountThresholds)
              .where(eq(discountThresholds.pricingRuleId, pricingRule.id));

            if (thresholdsResult.length > 0) {
              // Transform thresholds to match expected interface (snake_case)
              const thresholds = thresholdsResult.map(threshold => ({
                id: threshold.id,
                pricing_rule_id: threshold.pricingRuleId,
                quality_metric: threshold.qualityMetric as 'Violetas' | 'Humedad' | 'Moho',
                limit_value: parseFloat(threshold.limitValue),
                created_at: threshold.createdAt?.toISOString() || new Date().toISOString(),
                updated_at: threshold.updatedAt?.toISOString() || new Date().toISOString(),
                created_by: threshold.createdBy || undefined,
                updated_by: threshold.updatedBy || undefined,
              }));

              // Validate calculation
              const validationResult = validatePricingCalculation(
                fruitType.type,
                data.quality_evaluation,
                thresholds,
                pricingRule.qualityBasedPricingEnabled
              );

               if (validationResult.canCalculate) {
                 // First calculate weight discounts to get final weight
                 const weightDiscountResult = calculateWeightDiscounts(
                   totalWeight,
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
                   []  // No thresholds for price calculation
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
                  fruit_type: fruitType.type,
                  applied_thresholds: preview.applied_thresholds,
                };

                // Insert pricing calculation
                const pricingCalculationResult = await db
                  .insert(pricingCalculations)
                  .values({
                    receptionId: reception.id,
                    basePricePerKg: data.base_price_per_kg.toString(),
                    totalWeight: totalWeight.toString(),
                    grossValue: preview.gross_value.toString(),
                    totalDiscountAmount: preview.total_discount_amount.toString(),
                    finalTotal: preview.final_total.toString(),
                    calculationData: calculationData,
                    createdBy: session.id,
                  })
                  .returning();

                if (pricingCalculationResult.length > 0) {
                  const pricingCalculation = pricingCalculationResult[0];

                  // Update reception with pricing calculation ID
                  await db
                    .update(receptions)
                    .set({ pricingCalculationId: pricingCalculation.id })
                    .where(eq(receptions.id, reception.id));

                  pricingCalculationId = pricingCalculation.id;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error calculating pricing:", error);
        // Don't fail the whole operation if pricing calculation fails
      }
    }

    // Log audit
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "create",
      tableName: "receptions",
      recordId: reception.id,
    });

    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${reception.id}`);

    return {
      success: true,
      reception: {
        ...reception,
        pricing_calculation_id: pricingCalculationId,
      },
    };
  } catch (error: any) {
    console.error("Error creating reception with pricing:", error);
    return { error: error.message || "Error al crear la recepción" };
  }
}

export async function getReceptionPricing(receptionId: string) {
  try {
    const pricingCalculationResult = await db
      .select()
      .from(pricingCalculations)
      .where(eq(pricingCalculations.receptionId, receptionId))
      .limit(1);

    // If no pricing calculation exists, return null data (not an error)
    if (pricingCalculationResult.length === 0) {
      return { success: true, data: null, message: "No hay cálculo de precios para esta recepción" };
    }

    const pricingCalculation = pricingCalculationResult[0];

    // Transform to match expected interface format
    const transformedData = {
      id: pricingCalculation.id,
      reception_id: pricingCalculation.receptionId,
      base_price_per_kg: parseFloat(pricingCalculation.basePricePerKg),
      total_weight: parseFloat(pricingCalculation.totalWeight),
      gross_value: parseFloat(pricingCalculation.grossValue),
      total_discount_amount: parseFloat(pricingCalculation.totalDiscountAmount),
      final_total: parseFloat(pricingCalculation.finalTotal),
      calculation_data: pricingCalculation.calculationData,
      created_at: pricingCalculation.createdAt?.toISOString() || new Date().toISOString(),
      created_by: pricingCalculation.createdBy,
    };

    return { success: true, data: transformedData };
  } catch (error) {
    console.error("Error fetching reception pricing:", error);
    return { error: "Error al obtener el cálculo de precios" };
  }
}

/**
 * Calculate and save pricing for an existing reception
 */
export async function calculatePricingForExistingReception(receptionId: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Get reception details
    const receptionResult = await db
      .select({
        id: receptions.id,
        receptionDate: receptions.receptionDate,
        fruitTypeId: receptions.fruitTypeId,
        totalPesoFinal: receptions.totalPesoFinal,
        fruitType: {
          type: fruitTypes.type,
          subtype: fruitTypes.subtype,
        }
      })
      .from(receptions)
      .leftJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (receptionResult.length === 0) {
      return { success: false, error: "Recepción no encontrada" };
    }

    const reception = receptionResult[0];

    if (!reception.fruitType) {
      return { success: false, error: "Tipo de fruta no encontrado para la recepción" };
    }

    // Check if pricing already exists (we'll update it if it does)
    const existingPricing = await db
      .select()
      .from(pricingCalculations)
      .where(eq(pricingCalculations.receptionId, receptionId))
      .limit(1);

    // Get daily price for the reception date
    const receptionDate = reception.receptionDate ? new Date(reception.receptionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const dailyPriceResult = await db
      .select()
      .from(dailyPrices)
      .where(
        and(
          eq(dailyPrices.fruitTypeId, reception.fruitTypeId),
          eq(dailyPrices.priceDate, receptionDate),
          eq(dailyPrices.active, true)
        )
      )
      .limit(1);

    if (dailyPriceResult.length === 0) {
      return { success: false, error: "No hay precio diario disponible para esta recepción" };
    }

    const dailyPrice = dailyPriceResult[0];
    const basePricePerKg = parseFloat(dailyPrice.pricePerKg);

    // Get final weight (after quality discounts)
    const finalWeight = reception.totalPesoFinal ? parseFloat(reception.totalPesoFinal.toString()) : 0;

    if (finalWeight <= 0) {
      return { success: false, error: "El peso final de la recepción no es válido" };
    }

    // Get quality thresholds for the fruit type
    const thresholdsData = await db
      .select()
      .from(discountThresholds)
      .innerJoin(pricingRules, eq(discountThresholds.pricingRuleId, pricingRules.id))
      .where(eq(pricingRules.fruitType, reception.fruitType.type));

    const thresholds = thresholdsData.map(item => ({
      id: item.discount_thresholds.id,
      pricing_rule_id: item.discount_thresholds.pricingRuleId,
      quality_metric: item.discount_thresholds.qualityMetric as "Violetas" | "Humedad" | "Moho",
      limit_value: Number(item.discount_thresholds.limitValue),
      created_at: item.discount_thresholds.createdAt?.toISOString(),
      updated_at: item.discount_thresholds.updatedAt?.toISOString(),
      created_by: item.discount_thresholds.createdBy || undefined,
      updated_by: item.discount_thresholds.updatedBy || undefined,
    }));

    // Calculate pricing using final weight (no additional price discounts)
    const preview = calculatePricing(
      basePricePerKg,
      finalWeight,
      [], // No quality metrics for price calculation
      []  // No thresholds for price calculation
    );

    // Create pricing calculation data
    const calculationData = {
      quality_metrics: [], // No price discounts applied
      total_discounts: preview.total_discount_amount,
      timestamp: new Date().toISOString(),
      fruit_type: reception.fruitType.type,
      applied_thresholds: []
    };

    const pricingData = {
      receptionId: receptionId,
      basePricePerKg: basePricePerKg.toString(),
      totalWeight: finalWeight.toString(),
      grossValue: preview.gross_value.toString(),
      totalDiscountAmount: preview.total_discount_amount.toString(),
      finalTotal: preview.final_total.toString(),
      calculationData: calculationData,
    };

    let pricingCalculationResult;

    if (existingPricing.length > 0) {
      // Update existing pricing calculation
      pricingCalculationResult = await db
        .update(pricingCalculations)
        .set(pricingData)
        .where(eq(pricingCalculations.id, existingPricing[0].id))
        .returning();
    } else {
      // Insert new pricing calculation
      pricingCalculationResult = await db
        .insert(pricingCalculations)
        .values({
          ...pricingData,
          createdBy: session.id,
        })
        .returning();

      // Update reception with pricing calculation ID for new records
      if (pricingCalculationResult.length > 0) {
        await db
          .update(receptions)
          .set({ pricingCalculationId: pricingCalculationResult[0].id })
          .where(eq(receptions.id, receptionId));
      }
    }

    if (pricingCalculationResult.length === 0) {
      return { success: false, error: "Error al guardar el cálculo de precios" };
    }

    return { success: true, data: pricingCalculationResult[0] };
  } catch (error: any) {
    console.error("Error calculating pricing for existing reception:", error);
    return { success: false, error: error.message || "Error al calcular precios para la recepción" };
  }
}
