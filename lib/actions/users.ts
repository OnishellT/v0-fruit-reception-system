"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/actions/auth"
import { hashPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: "Error al obtener usuarios" }
  }

  return { users }
}

export async function createUser(formData: {
  username: string
  password: string
  full_name: string
  role: "admin" | "operator"
}) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  const supabase = await createClient()

  // Check if username already exists
  const { data: existingUser } = await supabase.from("users").select("id").eq("username", formData.username).single()

  if (existingUser) {
    return { error: "El nombre de usuario ya existe" }
  }

  // Hash password
  const password_hash = await hashPassword(formData.password)

  // Create user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username: formData.username,
      password_hash,
      full_name: formData.full_name,
      role: formData.role,
      is_active: true,
      created_by: session.id,
    })
    .select()
    .single()

  if (error) {
    return { error: "Error al crear usuario" }
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    user_id: session.id,
    action: "create_user",
    table_name: "users",
    record_id: newUser.id,
    new_values: { username: formData.username, role: formData.role },
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function updateUser(userId: string, formData: { full_name: string; role: "admin" | "operator" }) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  const supabase = await createClient()

  // Get old values for audit
  const { data: oldUser } = await supabase.from("users").select("full_name, role").eq("id", userId).single()

  // Update user
  const { error } = await supabase.from("users").update(formData).eq("id", userId)

  if (error) {
    return { error: "Error al actualizar usuario" }
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    user_id: session.id,
    action: "update_user",
    table_name: "users",
    record_id: userId,
    old_values: oldUser,
    new_values: formData,
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId)

  if (error) {
    return { error: "Error al actualizar estado del usuario" }
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    user_id: session.id,
    action: isActive ? "activate_user" : "deactivate_user",
    table_name: "users",
    record_id: userId,
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}
