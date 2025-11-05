"use server"

import { db } from "@/lib/db"
import { users, auditLogs } from "@/lib/db/schema"
import { verifyPassword } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { eq, sql } from "drizzle-orm"

export async function login(username: string, password: string) {
  try {
    // Find user by username
    const userData = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    const user = userData[0]

    // Check if no users exist at all (setup needed)
    if (!user) {
      // Check if any users exist
      const allUsers = await db.select({ count: sql`count(*)` }).from(users)
      if (allUsers[0].count === 0) {
        return { error: "setup_needed" }
      }
      return { error: "Usuario o contraseña incorrectos" }
    }

    if (!user.isActive) {
      return { error: "Usuario inactivo. Contacte al administrador." }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      return { error: "Usuario o contraseña incorrectos" }
    }

    // Create a session using cookies
    const cookieStore = await cookies()
    cookieStore.set(
      "user_session",
      JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8, // 8 hours
      },
    )

    // Log the login action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "login",
      tableName: "users",
      recordId: user.id,
    })

    return { success: true }
  } catch (error) {
    return { error: "Usuario o contraseña incorrectos" }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("user_session")

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)

      // Log the logout action
      await db.insert(auditLogs).values({
        userId: session.id,
        action: "logout",
        tableName: "users",
        recordId: session.id,
      })
    } catch (error) {
      // Ignore parsing errors
    }
  }

  cookieStore.delete("user_session")
  redirect("/login")
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("user_session")

  if (!sessionCookie) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}
