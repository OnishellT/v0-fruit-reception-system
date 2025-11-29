import bcrypt from "bcryptjs"

export interface User {
  id: string
  username: string
  full_name: string
  role: "admin" | "operator"
  is_active: boolean
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
