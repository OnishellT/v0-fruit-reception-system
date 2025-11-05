import { db } from "./lib/db/index.js"
import { users } from "./lib/db/schema.js"
import { sql, eq } from "drizzle-orm"

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUsers = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1)

    if (existingUsers.length > 0) {
      const user = existingUsers[0]
      console.log("Admin user already exists:", user)

      // Update password hash if it's different
      const correctHash = '$2b$10$CLRE1O22BBjqD6MRGL2J4.gdDSIwE9l1cYSWtMaCEiXqjGQ/EI04G'
      if (user.passwordHash !== correctHash) {
        await db
          .update(users)
          .set({
            passwordHash: correctHash,
            role: 'admin',
            isActive: true,
            updatedAt: sql`NOW()`
          })
          .where(eq(users.username, 'admin'))
        console.log("Admin user password updated successfully")
      } else {
        console.log("Admin user password is already correct")
      }
    } else {
      // Insert new admin user
      await db.insert(users).values({
        id: sql`gen_random_uuid()`,
        username: 'admin',
        passwordHash: '$2b$10$CLRE1O22BBjqD6MRGL2J4.gdDSIwE9l1cYSWtMaCEiXqjGQ/EI04G',
        fullName: 'Administrador del Sistema',
        role: 'admin',
        isActive: true,
        createdAt: sql`NOW()`,
        updatedAt: sql`NOW()`
      })

      console.log("Admin user created successfully")
    }

    // Verify the final state
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1)

    console.log("Final admin user state:", result[0])
  } catch (error) {
    console.error("Error managing admin user:", error)
  } finally {
    process.exit(0)
  }
}

createAdminUser()