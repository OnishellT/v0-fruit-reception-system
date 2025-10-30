import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function createAdminUser() {
  // Use Supabase connection string
  const sql = neon(process.env.SUPABASE_POSTGRES_URL!)

  console.log("[v0] Starting admin user creation...")

  try {
    // Generate bcrypt hash for password 'admin123'
    const passwordHash = await bcrypt.hash("admin123", 10)
    console.log("[v0] Password hash generated")

    // Delete existing admin user if exists
    await sql`DELETE FROM users WHERE username = 'admin'`
    console.log("[v0] Deleted any existing admin user")

    // Insert new admin user
    const result = await sql`
      INSERT INTO users (
        id,
        username,
        password_hash,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        'admin',
        ${passwordHash},
        'Administrador',
        'admin',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, username, full_name, role
    `

    console.log("[v0] Admin user created successfully:", result[0])

    // Verify the user exists
    const verification = await sql`
      SELECT username, full_name, role, is_active 
      FROM users 
      WHERE username = 'admin'
    `

    console.log("[v0] Verification - User found:", verification[0])
    console.log("[v0] ✅ Admin user is ready!")
    console.log("[v0] Username: admin")
    console.log("[v0] Password: admin123")
  } catch (error) {
    console.error("[v0] ❌ Error creating admin user:", error)
    throw error
  }
}

createAdminUser()
