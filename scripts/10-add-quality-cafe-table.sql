-- Migration: Add Quality Evaluation Table for Café Seco
-- Date: 2025-10-31
-- Purpose: Store post-reception quality evaluation data

-- Create calidad_cafe table
CREATE TABLE IF NOT EXISTS calidad_cafe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
  violetas DECIMAL(5,2) NOT NULL CHECK (violetas >= 0 AND violetas <= 100),
  humedad DECIMAL(5,2) NOT NULL CHECK (humedad >= 0 AND humedad <= 100),
  moho DECIMAL(5,2) NOT NULL CHECK (moho >= 0 AND moho <= 100),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(recepcion_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calidad_cafe_recepcion_id ON calidad_cafe(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_calidad_cafe_created_by ON calidad_cafe(created_by);
CREATE INDEX IF NOT EXISTS idx_calidad_cafe_updated_by ON calidad_cafe(updated_by);

-- Add RLS policies

-- Policy 1: Allow authenticated users to SELECT quality data
CREATE POLICY "Authenticated users can view quality data"
ON calidad_cafe FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow only admins to INSERT quality data
CREATE POLICY "Only admins can create quality data"
ON calidad_cafe FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Policy 3: Allow only admins to UPDATE quality data
CREATE POLICY "Only admins can update quality data"
ON calidad_cafe FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Policy 4: Allow only admins to DELETE quality data
CREATE POLICY "Only admins can delete quality data"
ON calidad_cafe FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Enable RLS on the table
ALTER TABLE calidad_cafe ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON TABLE calidad_cafe IS 'Post-reception quality evaluation data for Café Seco receptions';
COMMENT ON COLUMN calidad_cafe.recepcion_id IS 'Foreign key to receptions table (CASCADE DELETE)';
COMMENT ON COLUMN calidad_cafe.violetas IS 'Percentage of purple grains (0-100)';
COMMENT ON COLUMN calidad_cafe.humedad IS 'Moisture level percentage (0-100)';
COMMENT ON COLUMN calidad_cafe.moho IS 'Percentage of grains affected by mold (0-100)';
