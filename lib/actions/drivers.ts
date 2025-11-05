"use server";

import { db } from "@/lib/db";
import { drivers } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { eq, isNull, asc } from "drizzle-orm";

export async function getDrivers() {
  const data = await db
    .select()
    .from(drivers)
    .where(isNull(drivers.deletedAt))
    .orderBy(asc(drivers.name));

  return data;
}

export async function getDriver(id: string) {
  const data = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);

  if (data.length === 0) {
    throw new Error("Driver not found");
  }
  return data[0];
}

export async function createDriver(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const license_number = formData.get("license_number") as string;
  const phone = formData.get("phone") as string;

  await db.insert(drivers).values({
    name,
    licenseNumber: license_number,
    phone,
  });

  revalidatePath("/dashboard/choferes");
  return { success: true };
}

export async function updateDriver(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const license_number = formData.get("license_number") as string;
  const phone = formData.get("phone") as string;

  await db
    .update(drivers)
    .set({ name, licenseNumber: license_number, phone })
    .where(eq(drivers.id, id));

  revalidatePath("/dashboard/choferes");
  return { success: true };
}

export async function deleteDriver(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  await db
    .update(drivers)
    .set({ deletedAt: new Date() })
    .where(eq(drivers.id, id));

  revalidatePath("/dashboard/choferes");
  return { success: true };
}
