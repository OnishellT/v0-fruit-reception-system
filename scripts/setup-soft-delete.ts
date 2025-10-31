import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables from .env.local (explicit path)
dotenv.config({ path: ".env.local" });

async function setupSoftDelete() {
  console.log("[v0] Setting up soft delete support...\n");

  // Get the database URL from environment
  const postgresUrl = process.env.SUPABASE_POSTGRES_URL;

  if (!postgresUrl) {
    console.error("Missing SUPABASE_POSTGRES_URL environment variable");
    console.error("Please check your .env.local file contains:");
    console.error("  SUPABASE_POSTGRES_URL=your_postgres_url");
    process.exit(1);
  }

  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Add deleted_at column to providers
    console.log("[v0] Adding deleted_at column to providers table...");
    await pool.query(
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
    );
    console.log("[v0] ✓ Providers column added");

    // Add deleted_at column to drivers
    console.log("[v0] Adding deleted_at column to drivers table...");
    await pool.query(
      `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
    );
    console.log("[v0] ✓ Drivers column added");

    // Add deleted_at column to fruit_types
    console.log("[v0] Adding deleted_at column to fruit_types table...");
    await pool.query(
      `ALTER TABLE fruit_types ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
    );
    console.log("[v0] ✓ Fruit types column added");

    // Add deleted_at column to asociaciones
    console.log("[v0] Adding deleted_at column to asociaciones table...");
    await pool.query(
      `ALTER TABLE asociaciones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
    );
    console.log("[v0] ✓ Asociaciones column added");

    // Create indexes
    console.log("[v0] Creating indexes on deleted_at columns...");
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_providers_deleted_at ON providers(deleted_at)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_drivers_deleted_at ON drivers(deleted_at)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_fruit_types_deleted_at ON fruit_types(deleted_at)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_asociaciones_deleted_at ON asociaciones(deleted_at)`,
    );
    console.log("[v0] ✓ Indexes created");

    console.log("\n[v0] ✅ Soft delete setup completed successfully!");
    console.log("\nThe following changes were made:");
    console.log("  • Added 'deleted_at' column to providers table");
    console.log("  • Added 'deleted_at' column to drivers table");
    console.log("  • Added 'deleted_at' column to fruit_types table");
    console.log("  • Added 'deleted_at' column to asociaciones table");
    console.log(
      "  • Created indexes on deleted_at columns for better performance",
    );
    console.log(
      "\nDeleted records can now be restored or permanently removed later.",
    );

    // Close the pool
    await pool.end();
  } catch (error) {
    console.error("[v0] ❌ Error during setup:", error);
    await pool.end();
    process.exit(1);
  }
}

setupSoftDelete().catch((error) => {
  console.error("[v0] Fatal error:", error);
  process.exit(1);
});
