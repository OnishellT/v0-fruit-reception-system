"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { count } from "drizzle-orm";

export async function checkIfSetupNeeded() {
  try {
    const result = await db.select({ count: count() }).from(users);
    const userCount = result[0]?.count || 0;
    return { needed: userCount === 0 };
  } catch (error: any) {
    console.error("[v0] Error checking users:", error);
    return { needed: true, error: error.message };
  }
}

export async function createInitialAdmin(formData: FormData): Promise<void> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!username || !password || !fullName) {
    throw new Error("Todos los campos son requeridos");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  try {
    // Double check no users exist
    const result = await db.select({ count: count() }).from(users);
    const userCount = result[0]?.count || 0;

    if (userCount > 0) {
      throw new Error("El sistema ya ha sido configurado");
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the admin user
    await db.insert(users).values({
      username,
      passwordHash,
      fullName,
      role: "admin",
      isActive: true,
    });

    redirect("/login");
  } catch (error: any) {
    console.error("[v0] Error creating admin:", error);
    throw new Error("Error al crear el usuario administrador");
  }
}
