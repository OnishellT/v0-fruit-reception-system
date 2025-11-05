"use server";

import { db } from "@/lib/db";
import { providers, asociaciones } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { eq, isNull, asc } from "drizzle-orm";

export async function getProviders() {
  try {
    const data = await db
      .select({
        id: providers.id,
        code: providers.code,
        name: providers.name,
        contactPerson: providers.contactPerson,
        phone: providers.phone,
        address: providers.address,
        isActive: providers.isActive,
        createdAt: providers.createdAt,
        updatedAt: providers.updatedAt,
        createdBy: providers.createdBy,
        asociacionId: providers.asociacionId,
        deletedAt: providers.deletedAt,
        asociacion: {
          id: asociaciones.id,
          code: asociaciones.code,
          name: asociaciones.name,
        },
      })
      .from(providers)
      .leftJoin(asociaciones, eq(providers.asociacionId, asociaciones.id))
      .where(isNull(providers.deletedAt))
      .orderBy(asc(providers.name));

    return { data, error: null, asociacionesAvailable: true };
  } catch (error: any) {
    console.error("[v0] Exception fetching providers:", error);
    return { error: error.message, data: null, asociacionesAvailable: false };
  }
}

export async function getProvider(id: string) {
  const data = await db
    .select()
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);

  if (data.length === 0) {
    throw new Error("Provider not found");
  }
  return data[0];
}

export async function createProvider(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const contact = formData.get("contact") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const asociacionId = formData.get("asociacion_id") as string;

  try {
    await db.insert(providers).values({
      name,
      code,
      contactPerson: contact,
      phone,
      address,
      asociacionId: asociacionId === "none" ? null : asociacionId,
    });

    revalidatePath("/dashboard/proveedores");
    return { success: true };
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error(
        `El código de proveedor "${code}" ya existe. Por favor use un código diferente.`,
      );
    }
    throw error;
  }
}

export async function updateProvider(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const contact = formData.get("contact") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const asociacionId = formData.get("asociacion_id") as string;

  try {
    await db
      .update(providers)
      .set({
        name,
        code,
        contactPerson: contact,
        phone,
        address,
        asociacionId: asociacionId === "none" ? null : asociacionId,
      })
      .where(eq(providers.id, id));

    revalidatePath("/dashboard/proveedores");
    revalidatePath(`/dashboard/proveedores/${id}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error(
        `El código de proveedor "${code}" ya existe. Por favor use un código diferente.`,
      );
    }
    throw error;
  }
}

export async function deleteProvider(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  await db
    .update(providers)
    .set({ deletedAt: new Date() })
    .where(eq(providers.id, id));

  revalidatePath("/dashboard/proveedores");
  return { success: true };
}
