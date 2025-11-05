"use server";

import { db } from "@/lib/db";
import { cashCustomers, cashReceptions, users } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { eq, desc, like, or, and } from "drizzle-orm";
import type { CashCustomer } from "@/lib/db/schema";
import {
  CreateCashCustomerSchema,
  UpdateCashCustomerSchema,
  DeleteCashCustomerSchema,
  GetCashCustomersSchema,
} from "@/lib/validations/pricing";
import { logCashPOSAction } from "@/lib/utils/audit";

// ==============================
// CASH CUSTOMERS MANAGEMENT
// ==============================

/**
 * Create a new cash customer
 */
export async function createCashCustomer(data: {
  name: string;
  nationalId: string;
}): Promise<{ success: boolean; data?: CashCustomer; error?: string }> {
  try {
    // Validate input
    const validation = CreateCashCustomerSchema.safeParse(data);
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
      return { success: false, error: "No tiene permisos para crear clientes" };
    }

    // Check if national ID already exists
    const existingNationalId = await db
      .select()
      .from(cashCustomers)
      .where(eq(cashCustomers.nationalId, data.nationalId.trim()))
      .limit(1);

    if (existingNationalId.length > 0) {
      return { success: false, error: "Ya existe un cliente con esta cédula" };
    }

    // Check if name already exists (case insensitive)
    const existingName = await db
      .select()
      .from(cashCustomers)
      .where(eq(cashCustomers.name, data.name.trim()))
      .limit(1);

    if (existingName.length > 0) {
      return { success: false, error: "Ya existe un cliente con este nombre" };
    }

    // Create the customer
    const newCustomer = await db
      .insert(cashCustomers)
      .values({
        name: data.name.trim(),
        nationalId: data.nationalId.trim(),
        createdBy: session.id,
      })
      .returning();

    if (newCustomer.length === 0) {
      return { success: false, error: "Error al crear el cliente" };
    }

    // Log audit event
    await logCashPOSAction(session.id, 'create_customer', {
      tableName: 'cash_customers',
      recordId: newCustomer[0].id.toString(),
      newValues: {
        name: data.name.trim(),
        nationalId: data.nationalId.trim(),
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/customers");

    return { success: true, data: newCustomer[0] };
  } catch (error) {
    console.error("Unexpected error creating cash customer:", error);
    return {
      success: false,
      error: "Error inesperado al crear el cliente",
    };
  }
}

/**
 * Update an existing cash customer
 */
export async function updateCashCustomer(data: {
  id: number;
  name?: string;
  nationalId?: string;
}): Promise<{ success: boolean; data?: CashCustomer; error?: string }> {
  try {
    // Validate input
    const validation = UpdateCashCustomerSchema.safeParse(data);
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
      return { success: false, error: "No tiene permisos para actualizar clientes" };
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(cashCustomers)
      .where(eq(cashCustomers.id, data.id))
      .limit(1);

    if (existingCustomer.length === 0) {
      return { success: false, error: "Cliente no encontrado" };
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name !== undefined) {
      // Check if new name conflicts with existing ones (excluding current)
      const nameConflict = await db
        .select()
        .from(cashCustomers)
        .where(eq(cashCustomers.name, data.name.trim()))
        .limit(1);

      if (nameConflict.length > 0 && nameConflict[0].id !== data.id) {
        return { success: false, error: "Ya existe un cliente con este nombre" };
      }
      updateData.name = data.name.trim();
    }

    if (data.nationalId !== undefined) {
      // Check if new national ID conflicts with existing ones (excluding current)
      const nationalIdConflict = await db
        .select()
        .from(cashCustomers)
        .where(eq(cashCustomers.nationalId, data.nationalId.trim()))
        .limit(1);

      if (nationalIdConflict.length > 0 && nationalIdConflict[0].id !== data.id) {
        return { success: false, error: "Ya existe un cliente con esta cédula" };
      }
      updateData.nationalId = data.nationalId.trim();
    }

    // Update the customer
    const updatedCustomer = await db
      .update(cashCustomers)
      .set(updateData)
      .where(eq(cashCustomers.id, data.id))
      .returning();

    if (updatedCustomer.length === 0) {
      return { success: false, error: "Error al actualizar el cliente" };
    }

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/customers");
    revalidatePath(`/dashboard/cash-pos/customers/${data.id}`);

    return { success: true, data: updatedCustomer[0] };
  } catch (error) {
    console.error("Unexpected error updating cash customer:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar el cliente",
    };
  }
}

/**
 * Delete a cash customer
 */
export async function deleteCashCustomer(data: {
  id: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = DeleteCashCustomerSchema.safeParse(data);
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
      return { success: false, error: "Solo administradores pueden eliminar clientes" };
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(cashCustomers)
      .where(eq(cashCustomers.id, data.id))
      .limit(1);

    if (existingCustomer.length === 0) {
      return { success: false, error: "Cliente no encontrado" };
    }

    // Check if customer has associated receptions
    const receptionCount = await db
      .select({ count: cashReceptions.id })
      .from(cashReceptions)
      .where(eq(cashReceptions.customerId, data.id));

    if (receptionCount.length > 0) {
      return { success: false, error: "No se puede eliminar el cliente porque tiene recepciones asociadas" };
    }

    // Delete the customer
    await db
      .delete(cashCustomers)
      .where(eq(cashCustomers.id, data.id));

    // Revalidate paths
    revalidatePath("/dashboard/cash-pos/customers");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting cash customer:", error);
    return {
      success: false,
      error: "Error inesperado al eliminar el cliente",
    };
  }
}

/**
 * Get cash customers with filtering and search
 */
export async function getCashCustomers(data?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: CashCustomer[]; total?: number; error?: string }> {
  try {
    // Validate input if provided
    if (data) {
      const validation = GetCashCustomersSchema.safeParse(data);
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

    if (data?.search) {
      conditions.push(
        or(
          like(cashCustomers.name, `%${data.search}%`),
          like(cashCustomers.nationalId, `%${data.search}%`)
        )
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: cashCustomers.id })
      .from(cashCustomers)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult.length;

    // Query customers
    const customersData = await db
      .select()
      .from(cashCustomers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(cashCustomers.createdAt))
      .limit(data?.limit || 50)
      .offset(data?.offset || 0);

    return { success: true, data: customersData, total };
  } catch (error) {
    console.error("Unexpected error getting cash customers:", error);
    return {
      success: false,
      error: "Error inesperado al obtener los clientes",
    };
  }
}