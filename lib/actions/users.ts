"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/actions/auth"
import { hashPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { users, auditLogs } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function getUsers() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    const userData = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    return { users: userData }
  } catch (error) {
    return { error: "Error al obtener usuarios" }
  }
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

  try {
    // Check if username already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, formData.username))
      .limit(1)

    if (existingUser.length > 0) {
      return { error: "El nombre de usuario ya existe" }
    }

    // Hash password
    const password_hash = await hashPassword(formData.password)

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        username: formData.username,
        passwordHash: password_hash,
        fullName: formData.full_name,
        role: formData.role,
        isActive: true,
        createdBy: session.id,
      })
      .returning()

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "create_user",
      tableName: "users",
      recordId: newUser[0].id,
      newValues: { username: formData.username, role: formData.role },
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    return { error: "Error al crear usuario" }
  }
}

export async function updateUser(userId: string, formData: { full_name: string; role: "admin" | "operator" }) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    // Get old values for audit
    const oldUser = await db
      .select({ fullName: users.fullName, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    // Update user
    await db
      .update(users)
      .set({
        fullName: formData.full_name,
        role: formData.role,
      })
      .where(eq(users.id, userId))

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: "update_user",
      tableName: "users",
      recordId: userId,
      oldValues: oldUser[0] || null,
      newValues: formData,
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar usuario" }
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId))

    // Log the action
    await db.insert(auditLogs).values({
      userId: session.id,
      action: isActive ? "activate_user" : "deactivate_user",
      tableName: "users",
      recordId: userId,
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar estado del usuario" }
  }
}
