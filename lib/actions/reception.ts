"use server";

import { db } from "@/lib/db";
import {
  receptions,
  providers,
  drivers,
  fruitTypes,
  users,
  receptionDetails,
  qualityEvaluations,
  desgloseDescuentos,
  pricingCalculations,
  auditLogs
} from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { saveWeightDiscountCalculation, getDailyPrice } from "@/lib/actions/pricing";
import { eq, and, isNull, desc, inArray, like } from "drizzle-orm";

export async function getReceptions() {
  try {
    // Get receptions with joins
    const receptionsData = await db
      .select({
        id: receptions.id,
        receptionNumber: receptions.receptionNumber,
        providerId: receptions.providerId,
        driverId: receptions.driverId,
        fruitTypeId: receptions.fruitTypeId,
        truckPlate: receptions.truckPlate,
        totalContainers: receptions.totalContainers,
        totalWeight: receptions.totalPesoOriginal,
        status: receptions.status,
        createdAt: receptions.createdAt,
        updatedAt: receptions.updatedAt,
        createdBy: receptions.createdBy,
        syncedToDashboard: receptions.syncedToDashboard,
        pricingCalculationId: receptions.pricingCalculationId,
        totalPesoOriginal: receptions.totalPesoOriginal,
        totalPesoDescuento: receptions.totalPesoDescuento,
        totalPesoFinal: receptions.totalPesoFinal,
        labSampleWetWeight: receptions.labSampleWetWeight,
        labSampleDriedWeight: receptions.labSampleDriedWeight,
        totalPesoDried: receptions.totalPesoDried,
        fBatchId: receptions.fBatchId,
        // Provider data
        providerId_joined: providers.id,
        providerCode: providers.code,
        providerName: providers.name,
        // Driver data
        driverId_joined: drivers.id,
        driverName: drivers.name,
        // Fruit type data
        fruitTypeId_joined: fruitTypes.id,
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
        // User data
        createdByUserId: users.id,
        createdByUsername: users.username,
        // Pricing calculation
        pricingCalcId: pricingCalculations.id,
      })
      .from(receptions)
      .innerJoin(providers, and(eq(receptions.providerId, providers.id), isNull(providers.deletedAt)))
      .innerJoin(drivers, and(eq(receptions.driverId, drivers.id), isNull(drivers.deletedAt)))
      .innerJoin(fruitTypes, and(eq(receptions.fruitTypeId, fruitTypes.id), isNull(fruitTypes.deletedAt)))
      .leftJoin(users, eq(receptions.createdBy, users.id))
      .leftJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
      .orderBy(desc(receptions.createdAt))
      .limit(50);

    // Get reception IDs for quality data
    const receptionIds = receptionsData.map((r) => r.id);

    // Fetch quality data separately
    const qualityData = await db
      .select()
      .from(qualityEvaluations)
      .where(inArray(qualityEvaluations.recepcionId, receptionIds));

    // Transform and attach data
    const transformedReceptions = receptionsData.map((reception) => {
      const qualityForReception = qualityData.filter((q) => q.recepcionId === reception.id);

      return {
        id: reception.id,
        reception_number: reception.receptionNumber,
        provider_id: reception.providerId,
        driver_id: reception.driverId,
        fruit_type_id: reception.fruitTypeId,
        truck_plate: reception.truckPlate,
        total_containers: Number(reception.totalContainers),
        total_weight: Number(reception.totalWeight),
        status: reception.status,
        created_at: reception.createdAt?.toISOString(),
        updated_at: reception.updatedAt?.toISOString(),
        created_by: reception.createdBy,
        synced_to_dashboard: reception.syncedToDashboard,
        pricing_calculation_id: reception.pricingCalcId,
        total_peso_original: reception.totalPesoOriginal,
        total_peso_descuento: reception.totalPesoDescuento,
        total_peso_final: reception.totalPesoFinal,
        lab_sample_wet_weight: reception.labSampleWetWeight,
        lab_sample_dried_weight: reception.labSampleDriedWeight,
        total_peso_dried: reception.totalPesoDried,
        f_batch_id: reception.fBatchId,
        // Joined data
        provider: {
          id: reception.providerId_joined,
          code: reception.providerCode,
          name: reception.providerName,
        },
        driver: {
          id: reception.driverId_joined,
          name: reception.driverName,
        },
        fruit_type: {
          id: reception.fruitTypeId_joined,
          type: reception.fruitType,
          subtype: reception.fruitSubtype,
        },
        created_by_user: reception.createdByUserId ? {
          id: reception.createdByUserId,
          username: reception.createdByUsername,
        } : null,
        quality_evaluations: qualityForReception.map(q => ({
          id: q.id,
          recepcion_id: q.recepcionId,
          violetas: q.violetas ? Number(q.violetas) : null,
          humedad: q.humedad ? Number(q.humedad) : null,
          moho: q.moho ? Number(q.moho) : null,
          created_by: q.createdBy,
          updated_by: q.updatedBy,
          created_at: q.createdAt?.toISOString(),
          updated_at: q.updatedAt?.toISOString(),
        })),
      };
    });

    return { receptions: transformedReceptions };
  } catch (error) {
    console.error("Error fetching receptions:", error);
    return { error: "Error al obtener recepciones" };
  }
}

export async function getReceptionDetails(receptionId: string) {
  try {
    // Get reception with joins
    const receptionData = await db
      .select({
        id: receptions.id,
        receptionNumber: receptions.receptionNumber,
        providerId: receptions.providerId,
        driverId: receptions.driverId,
        fruitTypeId: receptions.fruitTypeId,
        truckPlate: receptions.truckPlate,
        totalContainers: receptions.totalContainers,
        totalWeight: receptions.totalPesoOriginal,
        status: receptions.status,
        receptionDate: receptions.receptionDate,
        notes: receptions.notes,
        createdAt: receptions.createdAt,
        updatedAt: receptions.updatedAt,
        createdBy: receptions.createdBy,
        syncedToDashboard: receptions.syncedToDashboard,
        pricingCalculationId: receptions.pricingCalculationId,
        totalPesoOriginal: receptions.totalPesoOriginal,
        totalPesoDescuento: receptions.totalPesoDescuento,
        totalPesoFinal: receptions.totalPesoFinal,
        labSampleWetWeight: receptions.labSampleWetWeight,
        labSampleDriedWeight: receptions.labSampleDriedWeight,
        totalPesoDried: receptions.totalPesoDried,
        fBatchId: receptions.fBatchId,
        // Provider data
        providerId_joined: providers.id,
        providerCode: providers.code,
        providerName: providers.name,
        // Driver data
        driverId_joined: drivers.id,
        driverName: drivers.name,
        // Fruit type data
        fruitTypeId_joined: fruitTypes.id,
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
        // User data
        createdByUserId: users.id,
        createdByUsername: users.username,
        // Pricing calculation
        pricingCalcId: pricingCalculations.id,
      })
      .from(receptions)
      .innerJoin(providers, eq(receptions.providerId, providers.id))
      .innerJoin(drivers, eq(receptions.driverId, drivers.id))
      .innerJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
      .leftJoin(users, eq(receptions.createdBy, users.id))
      .leftJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (receptionData.length === 0) {
      return { error: "Recepción no encontrada" };
    }

    const reception = receptionData[0];

    // Fetch reception details
    const detailsData = await db
      .select({
        id: receptionDetails.id,
        receptionId: receptionDetails.receptionId,
        fruitTypeId: receptionDetails.fruitTypeId,
        quantity: receptionDetails.quantity,
        weightKg: receptionDetails.weightKg,
        lineNumber: receptionDetails.lineNumber,
        originalWeight: receptionDetails.originalWeight,
        discountedWeight: receptionDetails.discountedWeight,
        discountPercentage: receptionDetails.discountPercentage,
        labSampleAdjustment: receptionDetails.labSampleAdjustment,
        // Fruit type data
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
      })
      .from(receptionDetails)
      .leftJoin(fruitTypes, eq(receptionDetails.fruitTypeId, fruitTypes.id))
      .where(eq(receptionDetails.receptionId, receptionId))
      .orderBy(receptionDetails.lineNumber);

    // Transform details
    const detailsWithFruitType = detailsData.map((detail: any) => ({
      id: detail.id,
      fruit_type_id: detail.fruitTypeId,
      quantity: Number(detail.quantity),
      weight_kg: Number(detail.weightKg),
      line_number: Number(detail.lineNumber),
      original_weight: detail.originalWeight,
      discounted_weight: detail.discountedWeight,
      discount_percentage: detail.discountPercentage,
      fruit_type: detail.fruitTypeId ? {
        id: detail.fruitTypeId,
        type: detail.fruitType,
        subtype: detail.fruitSubtype,
      } : null,
    }));

    // Fetch quality evaluation data
    const qualityData = await db
      .select()
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, receptionId))
      .limit(1);

    let qualityEvaluation = null;
    if (qualityData.length > 0) {
      const q = qualityData[0];
      qualityEvaluation = {
        id: q.id,
        recepcion_id: q.recepcionId,
        violetas: q.violetas ? Number(q.violetas) : null,
        humedad: q.humedad ? Number(q.humedad) : null,
        moho: q.moho ? Number(q.moho) : null,
        created_by: q.createdBy,
        updated_by: q.updatedBy,
        created_at: q.createdAt?.toISOString(),
        updated_at: q.updatedAt?.toISOString(),
      };
    }

    // Fetch discount breakdown
    const discountBreakdownData = await db
      .select()
      .from(desgloseDescuentos)
      .where(eq(desgloseDescuentos.recepcionId, receptionId))
      .orderBy(desc(desgloseDescuentos.createdAt));

    const discountBreakdown = discountBreakdownData.map(d => ({
      id: d.id,
      recepcion_id: d.recepcionId,
      parametro: d.parametro,
      umbral: Number(d.umbral),
      valor: Number(d.valor),
      porcentaje_descuento: Number(d.porcentajeDescuento),
      peso_descuento: Number(d.pesoDescuento),
      created_at: d.createdAt?.toISOString(),
      created_by: d.createdBy,
    }));

    // Transform reception data
    const receptionWithQuality = {
      id: reception.id,
      reception_number: reception.receptionNumber,
      provider_id: reception.providerId,
      driver_id: reception.driverId,
      fruit_type_id: reception.fruitTypeId,
      truck_plate: reception.truckPlate,
      total_containers: Number(reception.totalContainers),
      total_weight: Number(reception.totalWeight),
      status: reception.status,
      receptionDate: reception.receptionDate,
      notes: reception.notes,
      created_at: reception.createdAt?.toISOString(),
      updated_at: reception.updatedAt?.toISOString(),
      created_by: reception.createdBy,
      synced_to_dashboard: reception.syncedToDashboard,
      pricing_calculation_id: reception.pricingCalcId,
      total_peso_original: reception.totalPesoOriginal,
      total_peso_descuento: reception.totalPesoDescuento,
      total_peso_final: reception.totalPesoFinal,
      lab_sample_wet_weight: reception.labSampleWetWeight,
      lab_sample_dried_weight: reception.labSampleDriedWeight,
      total_peso_dried: reception.totalPesoDried,
      f_batch_id: reception.fBatchId,
      // Joined data
      provider: {
        id: reception.providerId_joined,
        code: reception.providerCode,
        name: reception.providerName,
      },
      driver: {
        id: reception.driverId_joined,
        name: reception.driverName,
      },
      fruit_type: {
        id: reception.fruitTypeId_joined,
        type: reception.fruitType,
        subtype: reception.fruitSubtype,
      },
      created_by_user: reception.createdByUserId ? {
        id: reception.createdByUserId,
        username: reception.createdByUsername,
      } : null,
      quality_evaluation: qualityEvaluation,
      discount_breakdown: discountBreakdown,
    };

    return { reception: receptionWithQuality, details: detailsWithFruitType };
  } catch (error) {
    console.error("Error fetching reception details:", error);
    return { error: "Error al cargar los detalles de la recepción" };
  }
}

export async function createReception(data: any) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    // Generate reception number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");

    // Get the last reception number for today
    const lastReceptionData = await db
      .select({ receptionNumber: receptions.receptionNumber })
      .from(receptions)
      .where(like(receptions.receptionNumber, `REC-${dateStr}-%`))
      .orderBy(desc(receptions.receptionNumber))
      .limit(1);

    let sequence = 1;
    if (lastReceptionData.length > 0) {
      const lastSequence = parseInt(
        lastReceptionData[0].receptionNumber.split("-")[2],
      );
      sequence = lastSequence + 1;
    }

    const reception_number = `REC-${dateStr}-${sequence.toString().padStart(4, "0")}`;

    // Calculate total_peso_original from reception_details
    let calculatedTotalWeight = 0;
    if (data.details && data.details.length > 0) {
      calculatedTotalWeight = data.details.reduce(
        (sum: number, detail: any) => {
          const weight = Number(detail.weight_kg);
          // Guard against invalid values
          if (isNaN(weight) || !isFinite(weight)) {
            console.warn("Invalid weight_kg value:", detail.weight_kg);
            return sum;
          }
          // Check if weight exceeds DECIMAL(10,2) limit
          if (weight > 99999999.99) {
            throw new Error(
              `Weight value ${weight} exceeds maximum allowed (99,999,999.99 kg)`,
            );
          }
          return sum + weight;
        },
        0,
      );

      // Check if total weight exceeds DECIMAL(10,2) limit
      if (calculatedTotalWeight > 99999999.99) {
        throw new Error(
          `Total weight ${calculatedTotalWeight} exceeds maximum allowed (99,999,999.99 kg)`,
        );
      }
    }

    const receptionInsertData = {
      receptionNumber: reception_number,
      providerId: data.provider_id,
      driverId: data.driver_id,
      fruitTypeId: data.fruit_type_id,
      truckPlate: data.truck_plate,
      totalContainers: data.total_containers,
      totalPesoOriginal: calculatedTotalWeight, // Set calculated total weight as number
      totalPesoFinal: calculatedTotalWeight, // No discounts during creation, so final = original
      createdBy: session.id,
    };

    const newReception = await db
      .insert(receptions)
      .values(receptionInsertData)
      .returning();

    if (newReception.length === 0) {
      throw new Error("Failed to create reception");
    }

    const reception = newReception[0];

    // Insert reception details
    if (data.details && data.details.length > 0) {
      const detailsWithReception = data.details.map((detail: any) => {
        const weight = Number(detail.weight_kg) || 0;
        return {
          receptionId: reception.id,
          fruitTypeId: detail.fruit_type_id,
          quantity: detail.quantity,
          weightKg: weight, // Use number for numeric column
          lineNumber: detail.line_number,
          originalWeight: weight, // Set original weight as number
          discountedWeight: weight, // No discounts yet, so discounted = original
          discountPercentage: 0, // No discount percentage yet
        };
      });

      await db
        .insert(receptionDetails)
        .values(detailsWithReception);
    }

    // Create pricing calculation if daily price is available
    let pricingCalculationId: string | null = null;
    try {
      console.log("💰 Creating pricing calculation for reception:", reception.receptionNumber);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log("📅 Today date:", today, "Fruit type ID:", data.fruit_type_id);
      const dailyPrice = await getDailyPrice(data.fruit_type_id, today);

      if (dailyPrice && dailyPrice.pricePerKg > 0) {
        // Get fruit type name for calculation data
        const fruitTypeResult = await db
          .select({ type: fruitTypes.type, subtype: fruitTypes.subtype })
          .from(fruitTypes)
          .where(eq(fruitTypes.id, data.fruit_type_id))
          .limit(1);

        if (fruitTypeResult.length > 0) {
          const fruitType = fruitTypeResult[0];
          const grossValue = calculatedTotalWeight * dailyPrice.pricePerKg;

          // Create pricing calculation
          const pricingResult = await db.insert(pricingCalculations).values({
            receptionId: reception.id,
            basePricePerKg: dailyPrice.pricePerKg.toString(),
            totalWeight: calculatedTotalWeight.toString(),
            grossValue: grossValue.toString(),
            totalDiscountAmount: "0", // No quality discounts for basic pricing
            finalTotal: grossValue.toString(),
            calculationData: {
              fruit_type: `${fruitType.type} - ${fruitType.subtype}`,
              timestamp: new Date().toISOString(),
              applied_thresholds: [],
              quality_metrics: [],
              daily_price_used: true,
              daily_price_date: today,
            },
            createdBy: session.id,
          }).returning({ id: pricingCalculations.id });

          if (pricingResult.length > 0) {
            pricingCalculationId = pricingResult[0].id;
            console.log("🆔 Created pricing calculation with ID:", pricingCalculationId);

            // Update reception with pricing calculation ID
            await db
              .update(receptions)
              .set({ pricingCalculationId })
              .where(eq(receptions.id, reception.id));

            console.log(`✅ Created pricing calculation for reception ${reception.receptionNumber} with daily price`);
          } else {
            console.log("⚠️ Pricing calculation insert returned no results");
          }
        }
      }
    } catch (pricingError) {
      console.warn("⚠️ Failed to create pricing calculation:", pricingError);
      // Don't fail the reception creation if pricing calculation fails
    }

    // Log audit
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "create",
      tableName: "receptions",
      recordId: reception.id,
    });

    revalidatePath("/dashboard/reception");
    return { success: true, reception: {
      id: reception.id,
      reception_number: reception.receptionNumber,
      provider_id: reception.providerId,
      driver_id: reception.driverId,
      fruit_type_id: reception.fruitTypeId,
      truck_plate: reception.truckPlate,
      total_containers: Number(reception.totalContainers),
      total_peso_original: reception.totalPesoOriginal,
      total_peso_final: reception.totalPesoFinal,
      created_by: reception.createdBy,
    } };
  } catch (error: any) {
    console.error("Error creating reception:", error);
    return { error: error.message || "Error al crear la recepción" };
  }
}

export async function updateReception(id: string, data: any) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    // Delete existing details
    await db
      .delete(receptionDetails)
      .where(eq(receptionDetails.receptionId, id));

    // Insert new details
    if (data.details && data.details.length > 0) {
      const detailsWithReception = data.details.map((detail: any) => {
        const weight = Number(detail.weight_kg) || 0;
        return {
          receptionId: id,
          fruitTypeId: detail.fruit_type_id,
          quantity: detail.quantity,
          weightKg: detail.weight_kg.toString(),
          lineNumber: detail.line_number,
          originalWeight: weight.toString(), // Set original weight
          discountedWeight: weight.toString(), // No discounts yet, so discounted = original
          discountPercentage: "0", // No discount percentage yet
        };
      });

      await db
        .insert(receptionDetails)
        .values(detailsWithReception);
    }

    // Calculate total_peso_original from reception_details
    let calculatedTotalWeight = 0;
    if (data.details && data.details.length > 0) {
      calculatedTotalWeight = data.details.reduce(
        (sum: number, detail: any) => {
          const weight = Number(detail.weight_kg);
          // Guard against invalid values
          if (isNaN(weight) || !isFinite(weight)) {
            console.warn("Invalid weight_kg value:", detail.weight_kg);
            return sum;
          }
          // Check if weight exceeds DECIMAL(10,2) limit
          if (weight > 99999999.99) {
            throw new Error(
              `Weight value ${weight} exceeds maximum allowed (99,999,999.99 kg)`,
            );
          }
          return sum + weight;
        },
        0,
      );

      // Check if total weight exceeds DECIMAL(10,2) limit
      if (calculatedTotalWeight > 99999999.99) {
        throw new Error(
          `Total weight ${calculatedTotalWeight} exceeds maximum allowed (99,999,999.99 kg)`,
        );
      }
    }

    // Check existing reception
    const existingReceptionData = await db
      .select({ totalPesoOriginal: receptions.totalPesoOriginal })
      .from(receptions)
      .where(eq(receptions.id, id))
      .limit(1);

    if (existingReceptionData.length === 0) {
      throw new Error("Reception not found");
    }

    const existingReception = existingReceptionData[0];

    // Update reception with basic fields
    const updateData: any = {
      providerId: data.provider_id,
      driverId: data.driver_id,
      fruitTypeId: data.fruit_type_id,
      truckPlate: data.truck_plate,
      totalContainers: data.total_containers,
    };

    // Only update total_peso_original if it's not already set or if details changed
    // This preserves the original weight and doesn't overwrite it with discounted values
    if (
      !existingReception.totalPesoOriginal ||
      existingReception.totalPesoOriginal === "0"
    ) {
      updateData.totalPesoOriginal = calculatedTotalWeight.toString();
    }

    // Add weight discount fields if discount calculation data is available
    // This should only happen during quality evaluation, not regular updates
    if (data.discount_calculation && data.quality_data) {
      const discountData = data.discount_calculation;
      updateData.totalPesoDescuento = discountData.total_peso_descuento.toString();
      updateData.totalPesoFinal = discountData.total_peso_final.toString();
    } else {
      // CRITICAL FIX: Do NOT reset total_peso_final to original
      // This preserves existing lab samples and discounts
      // The weight should only be changed by:
      // 1. Lab samples (via API)
      // 2. Quality evaluation (via database trigger)
      // 3. Admin override (explicit discount_calculation)

      // Remove total_peso_final from update if not provided
      // This prevents accidentally resetting it
      delete updateData.totalPesoFinal;

      // Only update total_peso_descuento if explicitly provided
      if (data.total_weight_descuento !== undefined) {
        updateData.totalPesoDescuento = data.total_weight_descuento.toString();
      }
    }

    const updatedReception = await db
      .update(receptions)
      .set(updateData)
      .where(eq(receptions.id, id))
      .returning();

    if (updatedReception.length === 0) {
      throw new Error("Failed to update reception");
    }

    const reception = updatedReception[0];

    // Log audit
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "update",
      tableName: "receptions",
      recordId: id,
    });

    // Save weight discount calculation if applicable
    if (data.quality_data && data.total_weight) {
      try {
        console.log("💾 Saving/updating weight discount calculation...");
        await saveWeightDiscountCalculation({
          reception_id: id,
          total_weight: data.total_weight,
          quality_data: data.quality_data,
          fruit_type_id: data.fruit_type_id,
        });
        console.log("✅ Weight discount calculation saved successfully");
      } catch (discountError) {
        console.error(
          "Error saving weight discount calculation:",
          discountError,
        );
        // Don't fail the whole operation, just log the error
      }
    }

    // Revalidate all relevant paths to ensure fresh data across the app
    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${id}`);
    revalidatePath(`/dashboard/reception/${id}/edit`);
    return { success: true, reception: {
      id: reception.id,
      reception_number: reception.receptionNumber,
      provider_id: reception.providerId,
      driver_id: reception.driverId,
      fruit_type_id: reception.fruitTypeId,
      truck_plate: reception.truckPlate,
      total_containers: Number(reception.totalContainers),
      total_peso_original: reception.totalPesoOriginal,
      total_peso_descuento: reception.totalPesoDescuento,
      total_peso_final: reception.totalPesoFinal,
      created_by: reception.createdBy,
    } };
  } catch (error: any) {
    console.error("Error updating reception:", error);
    return { error: error.message || "Error al actualizar la recepción" };
  }
}
