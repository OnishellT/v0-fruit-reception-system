-- Fix asociaciones and certifications tables with proper RLS

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS provider_certifications CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS asociaciones CASCADE;

-- Remove asociacion_id column from providers if it exists
ALTER TABLE providers DROP COLUMN IF EXISTS asociacion_id;

-- Create asociaciones table
CREATE TABLE asociaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create certifications table
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add asociacion_id to providers table
ALTER TABLE providers ADD COLUMN asociacion_id UUID REFERENCES asociaciones(id) ON DELETE SET NULL;

-- Create provider_certifications junction table (many-to-many)
CREATE TABLE provider_certifications (
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  certification_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
  issued_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (provider_id, certification_id)
);

-- Insert common certifications
INSERT INTO certifications (name, description) VALUES
  ('Fairtrade', 'Certificación de Comercio Justo'),
  ('Organic', 'Certificación Orgánica'),
  ('Rainforest Alliance', 'Certificación Rainforest Alliance'),
  ('UTZ', 'Certificación UTZ');

-- Enable RLS (but policies will be permissive since we handle auth at app level)
ALTER TABLE asociaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_certifications ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (permissive since we use service role key)
CREATE POLICY "Allow all operations on asociaciones" ON asociaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on certifications" ON certifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on provider_certifications" ON provider_certifications FOR ALL USING (true) WITH CHECK (true);
