"use server"

import { createClient } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function checkIfSetupNeeded() {
  const supabase = await createClient()

  const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

  if (error) {
    console.error("[v0] Error checking users:", error)
    return { needed: true, error: error.message }
  }

  console.log("[v0] User count:", count)
  return { needed: count === 0 }
}

export async function createInitialAdmin(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  if (!username || !password || !fullName) {
    return { error: "Todos los campos son requeridos" }
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" }
  }

  const supabase = await createClient()

  // Double check no users exist
  const { count } = await supabase.from("users").select("*", { count: "exact", head: true })

  if (count && count > 0) {
    return { error: "El sistema ya ha sido configurado" }
  }

  // Hash the password
  const passwordHash = await hashPassword(password)

  // Create the admin user
  const { error } = await supabase.from("users").insert({
    username,
    password_hash: passwordHash,
    full_name: fullName,
    role: "admin",
    is_active: true,
  })

  if (error) {
    console.error("[v0] Error creating admin:", error)
    return { error: "Error al crear el usuario administrador" }
  }

  redirect("/login")
}
