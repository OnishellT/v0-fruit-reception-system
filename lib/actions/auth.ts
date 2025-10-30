"use server"

import { createClient } from "@/lib/supabase/server"
import { verifyPassword } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function login(username: string, password: string) {
  const supabase = await createClient()

  // Find user by username
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username, password_hash, full_name, role, is_active")
    .eq("username", username)
    .maybeSingle() // Use maybeSingle instead of single to handle 0 rows gracefully

  // Check if no users exist at all (setup needed)
  if (!user && userError?.code === "PGRST116") {
    return { error: "setup_needed" }
  }

  if (userError || !user) {
    return { error: "Usuario o contraseña incorrectos" }
  }

  if (!user.is_active) {
    return { error: "Usuario inactivo. Contacte al administrador." }
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash)

  if (!isValidPassword) {
    return { error: "Usuario o contraseña incorrectos" }
  }

  // Create a session using Supabase Auth with the user's ID
  // We'll use a custom token approach or store session in cookies
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
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "login",
    table_name: "users",
    record_id: user.id,
  })

  return { success: true }
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("user_session")

  if (sessionCookie) {
    const session = JSON.parse(sessionCookie.value)
    const supabase = await createClient()

    // Log the logout action
    await supabase.from("audit_logs").insert({
      user_id: session.id,
      action: "logout",
      table_name: "users",
      record_id: session.id,
    })
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
