"use server";

import { db } from "@/lib/db";
import { cashFruitTypes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import type { CashFruitType } from "@/lib/db/schema";
import {
  CreateCashFruitTypeSchema,
  UpdateCashFruitTypeSchema,
  DeleteCashFruitTypeSchema,
  GetCashFruitTypesSchema,
} from "@/lib/validations/pricing";

// ==============================
// CASH FRUIT TYPES MANAGEMENT
// ==============================

/**
 * Create a new cash fruit type
 */
export async function createCashFruitType(data: {
  code: string;
  name: string;
}): Promise<{ success: boolean; data?: CashFruitType; error?: string }> {
  try {
    // Validate input
    const validation = CreateCashFruitTypeSchema.safeParse(data);
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

    // Check if code already exists
    const existingCode = await db
      .select()
      .from(cashFruitTypes)
      .where(eq(cashFruitTypes.code, data.code.toUpperCase()))
      .limit(1);

    if (existingCode.length > 0) {
      return { success: false, error: "Ya existe un tipo de fruta con este código" };
    }

    // Check if name already exists
    const existingName = await db
      .select()
      .from(cashFruitTypes)
      .where(eq(cashFruitTypes.name, data.name))
      .limit(1);

    if (existingName.length > 0) {
      return { success: false, error: "Ya existe un tipo de fruta con este nombre" };
    }

    // Create the fruit type
    const newFruitType = await db
      .insert(cashFruitTypes)
      .values({
        code: data.code.toUpperCase(),
        name: data.name,
        enabled: true,
      })
      .returning();

    if (newFruitType.length === 0) {
      return { success: false, error: "Error al crear el tipo de fruta" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/fruit-types");

    return { success: true, data: newFruitType[0] };
  } catch (error) {
    console.error("Unexpected error creating cash fruit type:", error);
    return {
      success: false,
      error: "Error inesperado al crear el tipo de fruta",
    };
  }
}

/**
 * Update an existing cash fruit type
 */
export async function updateCashFruitType(data: {
  id: number;
  code?: string;
  name?: string;
  enabled?: boolean;
}): Promise<{ success: boolean; data?: CashFruitType; error?: string }> {
  try {
    // Validate input
    const validation = UpdateCashFruitTypeSchema.safeParse(data);
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

    // Check if fruit type exists
    const existingFruitType = await db
      .select()
      .from(cashFruitTypes)
      .where(eq(cashFruitTypes.id, data.id))
      .limit(1);

    if (existingFruitType.length === 0) {
      return { success: false, error: "Tipo de fruta no encontrado" };
    }

    // Prepare update data
    const updateData: any = {};

    if (data.code !== undefined) {
      // Check if new code conflicts with existing ones (excluding current)
      const codeConflict = await db
        .select()
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.code, data.code.toUpperCase()))
        .limit(1);

      if (codeConflict.length > 0 && codeConflict[0].id !== data.id) {
        return { success: false, error: "Ya existe un tipo de fruta con este código" };
      }
      updateData.code = data.code.toUpperCase();
    }

    if (data.name !== undefined) {
      // Check if new name conflicts with existing ones (excluding current)
      const nameConflict = await db
        .select()
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.name, data.name))
        .limit(1);

      if (nameConflict.length > 0 && nameConflict[0].id !== data.id) {
        return { success: false, error: "Ya existe un tipo de fruta con este nombre" };
      }
      updateData.name = data.name;
    }

    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled;
    }

    // Update the fruit type
    const updatedFruitType = await db
      .update(cashFruitTypes)
      .set(updateData)
      .where(eq(cashFruitTypes.id, data.id))
      .returning();

    if (updatedFruitType.length === 0) {
      return { success: false, error: "Error al actualizar el tipo de fruta" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/fruit-types");

    return { success: true, data: updatedFruitType[0] };
  } catch (error) {
    console.error("Unexpected error updating cash fruit type:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar el tipo de fruta",
    };
  }
}

/**
 * Delete a cash fruit type
 */
export async function deleteCashFruitType(data: {
  id: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = DeleteCashFruitTypeSchema.safeParse(data);
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

    // Check if fruit type exists
    const existingFruitType = await db
      .select()
      .from(cashFruitTypes)
      .where(eq(cashFruitTypes.id, data.id))
      .limit(1);

    if (existingFruitType.length === 0) {
      return { success: false, error: "Tipo de fruta no encontrado" };
    }

    // Check if fruit type is being used in prices
    const priceCount = await db
      .select()
      .from(cashFruitTypes)
      .where(eq(cashFruitTypes.id, data.id))
      .limit(1);

    // For now, we'll allow deletion. In a production system, you might want to check
    // for foreign key constraints, but since we have CASCADE deletes set up in the schema,
    // this should be handled at the database level.

    // Delete the fruit type
    await db
      .delete(cashFruitTypes)
      .where(eq(cashFruitTypes.id, data.id));

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/fruit-types");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting cash fruit type:", error);
    return {
      success: false,
      error: "Error inesperado al eliminar el tipo de fruta",
    };
  }
}

/**
 * Get all cash fruit types
 */
export async function getCashFruitTypes(data?: {
  enabled_only?: boolean;
}): Promise<{ success: boolean; data?: CashFruitType[]; error?: string }> {
  try {
    // Validate input if provided
    if (data) {
      const validation = GetCashFruitTypesSchema.safeParse(data);
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

    if (data?.enabled_only !== false) { // Default to true if not specified
      conditions.push(eq(cashFruitTypes.enabled, true));
    }

    // Query fruit types
    const fruitTypesData = await db
      .select()
      .from(cashFruitTypes)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(cashFruitTypes.createdAt));

    return { success: true, data: fruitTypesData };
  } catch (error) {
    console.error("Unexpected error getting cash fruit types:", error);
    return {
      success: false,
      error: "Error inesperado al obtener los tipos de fruta",
    };
  }
}