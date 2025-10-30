-- Add certifications and asociaciones support

-- Create asociaciones table
CREATE TABLE IF NOT EXISTS asociaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add asociacion_id to providers table
ALTER TABLE providers ADD COLUMN IF NOT EXISTS asociacion_id UUID REFERENCES asociaciones(id) ON DELETE SET NULL;

-- Create provider_certifications junction table (many-to-many)
CREATE TABLE IF NOT EXISTS provider_certifications (
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
  ('UTZ', 'Certificación UTZ')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE asociaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all authenticated users to read asociaciones" ON asociaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage asociaciones" ON asociaciones FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow all authenticated users to read certifications" ON certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage certifications" ON certifications FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow all authenticated users to read provider_certifications" ON provider_certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage provider_certifications" ON provider_certifications FOR ALL TO authenticated USING (true);
