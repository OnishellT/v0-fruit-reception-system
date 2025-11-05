"use server";

import { db } from "@/lib/db";
import { fruitTypes } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { eq, isNull, asc } from "drizzle-orm";

export async function getFruitTypes() {
  const data = await db
    .select()
    .from(fruitTypes)
    .where(isNull(fruitTypes.deletedAt))
    .orderBy(asc(fruitTypes.type), asc(fruitTypes.subtype));

  return data;
}

export async function getFruitType(id: string) {
  const data = await db
    .select()
    .from(fruitTypes)
    .where(eq(fruitTypes.id, id))
    .limit(1);

  if (data.length === 0) {
    throw new Error("Fruit type not found");
  }
  return data[0];
}

export async function createFruitType(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  const type = formData.get("type") as string;
  const subtype = formData.get("subtype") as string;

  await db.insert(fruitTypes).values({
    type,
    subtype,
  });

  revalidatePath("/dashboard/tipos-fruto");
  return { success: true };
}

export async function updateFruitType(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  const type = formData.get("type") as string;
  const subtype = formData.get("subtype") as string;
  const description = formData.get("description") as string;

  await db
    .update(fruitTypes)
    .set({ type, subtype, description })
    .where(eq(fruitTypes.id, id));

  revalidatePath("/dashboard/tipos-fruto");
  return { success: true };
}

export async function deleteFruitType(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  await db
    .update(fruitTypes)
    .set({ deletedAt: new Date() })
    .where(eq(fruitTypes.id, id));

  revalidatePath("/dashboard/tipos-fruto");
  return { success: true };
}
