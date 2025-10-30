import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_NEON_NEON_DATABASE_URL!)

async function setupDatabase() {
  console.log("[v0] Starting database setup...")

  try {
    // Create asociaciones table
    console.log("[v0] Creating asociaciones table...")
    await sql`
      CREATE TABLE IF NOT EXISTS asociaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      )
    `
    console.log("[v0] ✓ Asociaciones table created")

    // Create certifications table
    console.log("[v0] Creating certifications table...")
    await sql`
      CREATE TABLE IF NOT EXISTS certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    console.log("[v0] ✓ Certifications table created")

    // Create provider_certifications junction table
    console.log("[v0] Creating provider_certifications table...")
    await sql`
      CREATE TABLE IF NOT EXISTS provider_certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
        certification_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
        issued_date DATE,
        expiry_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(provider_id, certification_id)
      )
    `
    console.log("[v0] ✓ Provider certifications table created")

    // Add asociacion_id to providers table if it doesn't exist
    console.log("[v0] Adding asociacion_id column to providers...")
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'providers' AND column_name = 'asociacion_id'
        ) THEN
          ALTER TABLE providers ADD COLUMN asociacion_id UUID REFERENCES asociaciones(id);
        END IF;
      END $$;
    `
    console.log("[v0] ✓ Asociacion_id column added to providers")

    // Insert default certifications
    console.log("[v0] Inserting default certifications...")
    await sql`
      INSERT INTO certifications (name, description) VALUES
        ('Fairtrade', 'Certificación de comercio justo'),
        ('Organic', 'Certificación orgánica'),
        ('Rainforest Alliance', 'Certificación de Rainforest Alliance'),
        ('UTZ', 'Certificación UTZ'),
        ('Bird Friendly', 'Certificación amigable con las aves')
      ON CONFLICT (name) DO NOTHING
    `
    console.log("[v0] ✓ Default certifications inserted")

    // Enable RLS on new tables
    console.log("[v0] Enabling Row Level Security...")
    await sql`ALTER TABLE asociaciones ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE certifications ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE provider_certifications ENABLE ROW LEVEL SECURITY`
    console.log("[v0] ✓ RLS enabled")

    // Create permissive policies (since we use service role)
    console.log("[v0] Creating RLS policies...")

    // Asociaciones policies
    await sql`
      DROP POLICY IF EXISTS "Allow all operations on asociaciones" ON asociaciones;
      CREATE POLICY "Allow all operations on asociaciones" ON asociaciones FOR ALL USING (true) WITH CHECK (true);
    `

    // Certifications policies
    await sql`
      DROP POLICY IF EXISTS "Allow all operations on certifications" ON certifications;
      CREATE POLICY "Allow all operations on certifications" ON certifications FOR ALL USING (true) WITH CHECK (true);
    `

    // Provider certifications policies
    await sql`
      DROP POLICY IF EXISTS "Allow all operations on provider_certifications" ON provider_certifications;
      CREATE POLICY "Allow all operations on provider_certifications" ON provider_certifications FOR ALL USING (true) WITH CHECK (true);
    `

    console.log("[v0] ✓ RLS policies created")

    console.log("[v0] ✅ Database setup completed successfully!")
    console.log("[v0] You can now use the Proveedores and Asociaciones pages.")
  } catch (error) {
    console.error("[v0] ❌ Error setting up database:", error)
    throw error
  }
}

setupDatabase()
