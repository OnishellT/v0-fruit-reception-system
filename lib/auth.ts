import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  username: string
  full_name: string
  role: "admin" | "operator"
  is_active: boolean
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  // Get the current session user ID from Supabase auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Fetch user details from our users table
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, full_name, role, is_active")
    .eq("id", authUser.id)
    .single()

  if (error || !user || !user.is_active) {
    return null
  }

  return user as User
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
