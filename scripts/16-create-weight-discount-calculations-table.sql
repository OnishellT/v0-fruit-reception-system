-- Migration 16: Create Weight Discount Calculations Table
-- Fixes missing table that causes discount calculation failures
-- Date: 2025-10-31

-- ===========================================
-- CREATE WEIGHT DISCOUNT CALCULATIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS weight_discount_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
  calculation_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

COMMENT ON TABLE weight_discount_calculations IS 'Audit trail for weight discount calculations';
COMMENT ON COLUMN weight_discount_calculations.reception_id IS 'Reference to the reception';
COMMENT ON COLUMN weight_discount_calculations.calculation_data IS 'Complete calculation result data';
COMMENT ON COLUMN weight_discount_calculations.created_by IS 'User who performed the calculation';

-- ===========================================
-- ADD INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_weight_discount_calculations_reception_id
ON weight_discount_calculations(reception_id);

CREATE INDEX IF NOT EXISTS idx_weight_discount_calculations_created_at
ON weight_discount_calculations(created_at);

CREATE INDEX IF NOT EXISTS idx_weight_discount_calculations_created_by
ON weight_discount_calculations(created_by);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE weight_discount_calculations ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE RLS POLICIES
-- ===========================================

-- Policy for authenticated users to insert their own calculations
CREATE POLICY "Allow authenticated users to insert weight discount calculations"
ON weight_discount_calculations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for users to view calculations for receptions they created
CREATE POLICY "Users can view weight discount calculations"
ON weight_discount_calculations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM receptions
    WHERE receptions.id = weight_discount_calculations.reception_id
    AND receptions.created_by = auth.uid()
  )
);

-- Policy for users to update their own calculations
CREATE POLICY "Users can update own weight discount calculations"
ON weight_discount_calculations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM receptions
    WHERE receptions.id = weight_discount_calculations.reception_id
    AND receptions.created_by = auth.uid()
  )
);

-- ===========================================
-- GRANT PERMISSIONS
-- ===========================================

GRANT SELECT, INSERT, UPDATE ON weight_discount_calculations TO authenticated;

-- ===========================================
-- VERIFICATION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 16 completed successfully: weight_discount_calculations table created';
  RAISE NOTICE '- Table created with proper RLS policies';
  RAISE NOTICE '- Indexes created for optimal performance';
  RAISE NOTICE '- Weight discount calculations can now be audited properly';
END $$;