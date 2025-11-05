"use server";

import { db } from "@/lib/db";
import { cashDailyPrices, cashFruitTypes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { eq, and, gte, lte, desc, ne } from "drizzle-orm";
import type { CashDailyPrice } from "@/lib/db/schema";
import {
  CreateDailyPriceSchema,
  UpdateDailyPriceSchema,
  DeleteDailyPriceSchema,
  GetDailyPricesSchema,
} from "@/lib/validations/pricing";

// ==============================
// DAILY PRICE MANAGEMENT
// ==============================

/**
 * Create a new daily price for a fruit type
 */
export async function createDailyPrice(data: {
  fruit_type_id: number;
  price_date: string;
  price_per_kg: number;
}): Promise<{ success: boolean; data?: CashDailyPrice; error?: string }> {
  try {
    // Validate input
    const validation = CreateDailyPriceSchema.safeParse(data);
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

    // Check if price already exists for this date and fruit type
    const existingPrice = await db
      .select()
      .from(cashDailyPrices)
      .where(and(
        eq(cashDailyPrices.fruitTypeId, data.fruit_type_id),
        eq(cashDailyPrices.priceDate, data.price_date)
      ))
      .limit(1);

    if (existingPrice.length > 0) {
      return { success: false, error: "Ya existe un precio para esta fecha y tipo de fruta" };
    }

    // Create the price
    const newPrice = await db
      .insert(cashDailyPrices)
      .values({
        fruitTypeId: data.fruit_type_id,
        priceDate: data.price_date,
        pricePerKg: data.price_per_kg.toString(),
        createdBy: session.id,
        active: true,
      })
      .returning();

    if (newPrice.length === 0) {
      return { success: false, error: "Error al crear el precio" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/pricing");

    return { success: true, data: newPrice[0] };
  } catch (error) {
    console.error("Unexpected error creating daily price:", error);
    return {
      success: false,
      error: "Error inesperado al crear el precio",
    };
  }
}

/**
 * Update an existing daily price
 */
export async function updateDailyPrice(data: {
  id: number;
  price_per_kg?: number;
  active?: boolean;
}): Promise<{ success: boolean; data?: CashDailyPrice; error?: string }> {
  try {
    // Validate input
    const validation = UpdateDailyPriceSchema.safeParse(data);
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

    // Check if price exists
    const existingPrice = await db
      .select()
      .from(cashDailyPrices)
      .where(eq(cashDailyPrices.id, data.id))
      .limit(1);

    if (existingPrice.length === 0) {
      return { success: false, error: "Precio no encontrado" };
    }

    const currentPrice = existingPrice[0];

    // Prepare update data
    const updateData: any = {};

    if (data.price_per_kg !== undefined) {
      updateData.pricePerKg = data.price_per_kg.toString();
    }

    if (data.active !== undefined) {
      // Business logic for activation/deactivation
      if (data.active) {
        // Activating a price - ensure no other active price exists for the same date and fruit type
        const conflictingPrices = await db
          .select({ id: cashDailyPrices.id })
          .from(cashDailyPrices)
          .where(and(
            eq(cashDailyPrices.fruitTypeId, currentPrice.fruitTypeId),
            eq(cashDailyPrices.priceDate, currentPrice.priceDate),
            eq(cashDailyPrices.active, true),
            ne(cashDailyPrices.id, data.id) // Exclude current price
          ));

        if (conflictingPrices.length > 0) {
          return {
            success: false,
            error: "Ya existe un precio activo para esta fecha y tipo de fruta. Desactive el precio existente primero."
          };
        }
      } else {
        // Deactivating a price - check if this is the only active price for this fruit type
        const otherActivePrices = await db
          .select({ id: cashDailyPrices.id })
          .from(cashDailyPrices)
          .where(and(
            eq(cashDailyPrices.fruitTypeId, currentPrice.fruitTypeId),
            eq(cashDailyPrices.active, true),
            ne(cashDailyPrices.id, data.id) // Exclude current price
          ));

        if (otherActivePrices.length === 0) {
          return {
            success: false,
            error: "No se puede desactivar el último precio activo para este tipo de fruta. Cree un nuevo precio primero."
          };
        }
      }

      updateData.active = data.active;
    }

    // Update the price
    const updatedPrice = await db
      .update(cashDailyPrices)
      .set(updateData)
      .where(eq(cashDailyPrices.id, data.id))
      .returning();

    if (updatedPrice.length === 0) {
      return { success: false, error: "Error al actualizar el precio" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/pricing");

    return { success: true, data: updatedPrice[0] };
  } catch (error) {
    console.error("Unexpected error updating daily price:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar el precio",
    };
  }
}

/**
 * Delete a daily price (soft delete by setting active = false)
 */
export async function deleteDailyPrice(data: {
  id: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = DeleteDailyPriceSchema.safeParse(data);
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

    // Check if price exists
    const existingPrice = await db
      .select()
      .from(cashDailyPrices)
      .where(eq(cashDailyPrices.id, data.id))
      .limit(1);

    if (existingPrice.length === 0) {
      return { success: false, error: "Precio no encontrado" };
    }

    // Soft delete by setting active = false
    await db
      .update(cashDailyPrices)
      .set({
        active: false,
      })
      .where(eq(cashDailyPrices.id, data.id));

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/pricing");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting daily price:", error);
    return {
      success: false,
      error: "Error inesperado al eliminar el precio",
    };
  }
}

/**
 * Get daily prices with optional filtering
 */
export async function getDailyPrices(data?: {
  fruit_type_id?: number;
  start_date?: string;
  end_date?: string;
  active_only?: boolean;
}): Promise<{ success: boolean; data?: CashDailyPrice[]; error?: string }> {
  try {
    // Validate input if provided
    if (data) {
      const validation = GetDailyPricesSchema.safeParse(data);
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
      conditions.push(eq(cashDailyPrices.fruitTypeId, data.fruit_type_id));
    }

    if (data?.start_date) {
      conditions.push(gte(cashDailyPrices.priceDate, data.start_date));
    }

    if (data?.end_date) {
      conditions.push(lte(cashDailyPrices.priceDate, data.end_date));
    }

    if (data?.active_only !== false) { // Default to true if not specified
      conditions.push(eq(cashDailyPrices.active, true));
    }

    // Query prices with fruit type information
    const pricesData = await db
      .select({
        id: cashDailyPrices.id,
        fruitTypeId: cashDailyPrices.fruitTypeId,
        priceDate: cashDailyPrices.priceDate,
        pricePerKg: cashDailyPrices.pricePerKg,
        createdAt: cashDailyPrices.createdAt,
        createdBy: cashDailyPrices.createdBy,
        active: cashDailyPrices.active,
        fruitType: {
          code: cashFruitTypes.code,
          name: cashFruitTypes.name,
        },
      })
      .from(cashDailyPrices)
      .innerJoin(cashFruitTypes, eq(cashDailyPrices.fruitTypeId, cashFruitTypes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(cashDailyPrices.priceDate), desc(cashDailyPrices.createdAt));

    // Transform the data to match expected format
    const prices = pricesData.map(price => ({
      id: price.id,
      fruitTypeId: price.fruitTypeId,
      priceDate: price.priceDate,
      pricePerKg: price.pricePerKg,
      createdAt: price.createdAt,
      createdBy: price.createdBy,
      active: price.active,
      fruitType: price.fruitType,
    }));

    return { success: true, data: prices as CashDailyPrice[] };
  } catch (error) {
    console.error("Unexpected error getting daily prices:", error);
    return {
      success: false,
      error: "Error inesperado al obtener los precios",
    };
  }
}

/**
 * Get the active price for a specific fruit type on a specific date
 * Used during reception creation to get the current price
 */
export async function getPriceForReception(data: {
  fruit_type_id: number;
  reception_date: string;
}): Promise<{ success: boolean; data?: { price_per_kg: number; price_id: number }; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Get the active price for the specific date and fruit type
    const priceData = await db
      .select({
        id: cashDailyPrices.id,
        pricePerKg: cashDailyPrices.pricePerKg,
      })
      .from(cashDailyPrices)
      .where(and(
        eq(cashDailyPrices.fruitTypeId, data.fruit_type_id),
        eq(cashDailyPrices.priceDate, data.reception_date),
        eq(cashDailyPrices.active, true)
      ))
      .limit(1);

    if (priceData.length === 0) {
      return { success: false, error: "No hay precio activo para esta fecha y tipo de fruta" };
    }

    const price = priceData[0];

    return {
      success: true,
      data: {
        price_per_kg: parseFloat(price.pricePerKg),
        price_id: price.id,
      }
    };
  } catch (error) {
    console.error("Unexpected error getting price for reception:", error);
    return {
      success: false,
      error: "Error inesperado al obtener el precio",
    };
  }
}

/**
 * Get the latest active price for a fruit type (fallback for when no date-specific price exists)
 */
export async function getLatestPriceForFruitType(data: {
  fruit_type_id: number;
}): Promise<{ success: boolean; data?: { price_per_kg: number; price_id: number; price_date: string }; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // Get the most recent active price for the fruit type
    const priceData = await db
      .select({
        id: cashDailyPrices.id,
        pricePerKg: cashDailyPrices.pricePerKg,
        priceDate: cashDailyPrices.priceDate,
      })
      .from(cashDailyPrices)
      .where(and(
        eq(cashDailyPrices.fruitTypeId, data.fruit_type_id),
        eq(cashDailyPrices.active, true)
      ))
      .orderBy(desc(cashDailyPrices.priceDate))
      .limit(1);

    if (priceData.length === 0) {
      return { success: false, error: "No hay precio activo para este tipo de fruta" };
    }

    const price = priceData[0];

    return {
      success: true,
      data: {
        price_per_kg: parseFloat(price.pricePerKg),
        price_id: price.id,
        price_date: price.priceDate,
      }
    };
  } catch (error) {
    console.error("Unexpected error getting latest price for fruit type:", error);
    return {
      success: false,
      error: "Error inesperado al obtener el precio más reciente",
    };
  }
}

/**
 * Validate that an active price exists for a fruit type and date
 * Used before creating receptions to ensure pricing data is available
 */
export async function validatePriceExists(data: {
  fruit_type_id: number;
  reception_date: string;
}): Promise<{ success: boolean; has_price: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, has_price: false, error: "No autorizado" };
    }

    // Check if an active price exists for the specific date and fruit type
    const priceCount = await db
      .select({ count: cashDailyPrices.id })
      .from(cashDailyPrices)
      .where(and(
        eq(cashDailyPrices.fruitTypeId, data.fruit_type_id),
        eq(cashDailyPrices.priceDate, data.reception_date),
        eq(cashDailyPrices.active, true)
      ));

    const hasPrice = priceCount.length > 0;

    return {
      success: true,
      has_price: hasPrice,
    };
  } catch (error) {
    console.error("Unexpected error validating price existence:", error);
    return {
      success: false,
      has_price: false,
      error: "Error inesperado al validar la existencia del precio",
    };
  }
}