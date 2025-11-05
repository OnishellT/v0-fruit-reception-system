"use server";

import { db } from "@/lib/db";
import { asociaciones, providers } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { eq, isNull, asc, ne, sql, count, and } from "drizzle-orm";

export async function getAsociaciones() {
  try {
    // Get asociaciones with provider counts
    const data = await db
      .select({
        id: asociaciones.id,
        code: asociaciones.code,
        name: asociaciones.name,
        description: asociaciones.description,
        createdAt: asociaciones.createdAt,
        deletedAt: asociaciones.deletedAt,
        providers_count: sql<number>`count(${providers.id})`,
      })
      .from(asociaciones)
      .leftJoin(providers, eq(asociaciones.id, providers.asociacionId))
      .where(isNull(asociaciones.deletedAt))
      .groupBy(asociaciones.id, asociaciones.code, asociaciones.name, asociaciones.description, asociaciones.createdAt, asociaciones.deletedAt)
      .orderBy(asc(asociaciones.name));

    return { data, error: null };
  } catch (error: any) {
    console.error("[v0] Exception fetching asociaciones:", error);
    return { error: error.message, data: null };
  }
}

export async function getAsociacion(id: string) {
  const data = await db
    .select()
    .from(asociaciones)
    .where(eq(asociaciones.id, id))
    .limit(1);

  if (data.length === 0) {
    throw new Error("Asociacion not found");
  }
  return data[0];
}

export async function createAsociacion(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "No autorizado", success: false };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  try {
    // Check if code already exists
    const existingCode = await db
      .select({ id: asociaciones.id, code: asociaciones.code })
      .from(asociaciones)
      .where(and(eq(asociaciones.code, code), isNull(asociaciones.deletedAt)))
      .limit(1);

    if (existingCode.length > 0) {
      return {
        error: `El código de asociación "${code}" ya existe. Por favor use un código diferente.`,
        success: false,
      };
    }

    // Check if name already exists
    const existingName = await db
      .select({ id: asociaciones.id, name: asociaciones.name })
      .from(asociaciones)
      .where(and(eq(asociaciones.name, name), isNull(asociaciones.deletedAt)))
      .limit(1);

    if (existingName.length > 0) {
      return {
        error: `Ya existe una asociación con el nombre "${name}". Por favor use un nombre diferente.`,
        success: false,
      };
    }

    await db.insert(asociaciones).values({
      code,
      name,
      description,
    });

    revalidatePath("/dashboard/asociaciones");
    return { success: true };
  } catch (error: any) {
    // Handle PostgreSQL unique constraint violations
    if (error.code === "23505") {
      if (error.message.includes("code")) {
        return {
          error: `El código de asociación "${code}" ya existe. Por favor use un código diferente.`,
          success: false,
        };
      } else if (error.message.includes("name")) {
        return {
          error: `Ya existe una asociación con el nombre "${name}". Por favor use un nombre diferente.`,
          success: false,
        };
      }
      return {
        error: "Ya existe una asociación con estos datos. Por favor verifique el código y nombre.",
        success: false,
      };
    }
    return { error: error.message, success: false };
  }
}

export async function updateAsociacion(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "No autorizado", success: false };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  try {
    // Check if code already exists (excluding current record)
    const existingCode = await db
      .select({ id: asociaciones.id, code: asociaciones.code })
      .from(asociaciones)
      .where(and(eq(asociaciones.code, code), ne(asociaciones.id, id), isNull(asociaciones.deletedAt)))
      .limit(1);

    if (existingCode.length > 0) {
      return {
        error: `El código de asociación "${code}" ya existe. Por favor use un código diferente.`,
        success: false,
      };
    }

    // Check if name already exists (excluding current record)
    const existingName = await db
      .select({ id: asociaciones.id, name: asociaciones.name })
      .from(asociaciones)
      .where(and(eq(asociaciones.name, name), ne(asociaciones.id, id), isNull(asociaciones.deletedAt)))
      .limit(1);

    if (existingName.length > 0) {
      return {
        error: `Ya existe una asociación con el nombre "${name}". Por favor use un nombre diferente.`,
        success: false,
      };
    }

    await db
      .update(asociaciones)
      .set({ code, name, description })
      .where(eq(asociaciones.id, id));

    revalidatePath("/dashboard/asociaciones");
    return { success: true };
  } catch (error: any) {
    // Handle PostgreSQL unique constraint violations
    if (error.code === "23505") {
      if (error.message.includes("code")) {
        return {
          error: `El código de asociación "${code}" ya existe. Por favor use un código diferente.`,
          success: false,
        };
      } else if (error.message.includes("name")) {
        return {
          error: `Ya existe una asociación con el nombre "${name}". Por favor use un nombre diferente.`,
          success: false,
        };
      }
      return {
        error: "Ya existe una asociación con estos datos. Por favor verifique el código y nombre.",
        success: false,
      };
    }
    return { error: error.message, success: false };
  }
}

export async function deleteAsociacion(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  await db
    .update(asociaciones)
    .set({ deletedAt: new Date() })
    .where(eq(asociaciones.id, id));

  revalidatePath("/dashboard/asociaciones");
  return { success: true };
}
