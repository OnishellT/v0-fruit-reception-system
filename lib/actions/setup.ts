"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function checkIfSetupNeeded() {
  const supabase = await createServiceRoleClient();

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[v0] Error checking users:", error);
    return { needed: true, error: error.message };
  }

  return { needed: count === 0 };
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

  const supabase = await createServiceRoleClient();

  // Double check no users exist
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    throw new Error("El sistema ya ha sido configurado");
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create the admin user
  const { error } = await supabase.from("users").insert({
    username,
    password_hash: passwordHash,
    full_name: fullName,
    role: "admin",
    is_active: true,
  });

  if (error) {
    console.error("[v0] Error creating admin:", error);
    throw new Error("Error al crear el usuario administrador");
  }

  redirect("/login");
}
