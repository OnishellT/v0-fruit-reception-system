-- Migration: Fix Foreign Key Relationship for calidad_cafe
-- Date: 2025-10-31
-- Purpose: Ensure PostgREST recognizes the foreign key relationship

-- Drop the existing foreign key constraint if it exists
ALTER TABLE calidad_cafe DROP CONSTRAINT IF EXISTS calidad_cafe_recepcion_id_fkey;

-- Add the foreign key constraint back with explicit name
ALTER TABLE calidad_cafe
ADD CONSTRAINT calidad_cafe_recepcion_id_fkey
FOREIGN KEY (recepcion_id) REFERENCES receptions(id)
ON DELETE CASCADE;

-- Create an index on the foreign key for performance
CREATE INDEX IF NOT EXISTS idx_calidad_cafe_recepcion_id_fkey ON calidad_cafe(recepcion_id);

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Add comment
COMMENT ON TABLE calidad_cafe IS 'Post-reception quality evaluation data for Café Seco receptions - Foreign key to receptions established';
