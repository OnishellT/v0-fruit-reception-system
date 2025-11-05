-- Migration: Add Pricing Calculation Foreign Key to Receptions
-- Date: 2025-10-31
-- Purpose: Link receptions to their immutable pricing calculations

-- ===========================================
-- ADD FOREIGN KEY TO RECEPTIONS TABLE
-- ===========================================

ALTER TABLE receptions
ADD COLUMN IF NOT EXISTS pricing_calculation_id UUID REFERENCES pricing_calculations(id);

-- Index for fast pricing data retrieval
CREATE INDEX IF NOT EXISTS idx_receptions_pricing_calculation ON receptions(pricing_calculation_id);

-- Add comment
COMMENT ON COLUMN receptions.pricing_calculation_id IS 'Foreign key to pricing_calculations table (1:1 relationship, immutable pricing data)';

-- ===========================================
-- CREATE RLS POLICIES
-- ===========================================

-- ==============================
-- Pricing Rules RLS Policies
-- ==============================

-- Policy 1: Allow authenticated users to SELECT pricing rules
CREATE POLICY "Authenticated users can view pricing rules"
ON pricing_rules FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow only admins to INSERT pricing rules
CREATE POLICY "Only admins can create pricing rules"
ON pricing_rules FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Policy 3: Allow only admins to UPDATE pricing rules
CREATE POLICY "Only admins can update pricing rules"
ON pricing_rules FOR UPDATE
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

-- Policy 4: Allow only admins to DELETE pricing rules
CREATE POLICY "Only admins can delete pricing rules"
ON pricing_rules FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- ==============================
-- Discount Thresholds RLS Policies
-- ==============================

-- Policy 1: Allow authenticated users to SELECT discount thresholds
CREATE POLICY "Authenticated users can view discount thresholds"
ON discount_thresholds FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow only admins to INSERT discount thresholds
CREATE POLICY "Only admins can create discount thresholds"
ON discount_thresholds FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Policy 3: Allow only admins to UPDATE discount thresholds
CREATE POLICY "Only admins can update discount thresholds"
ON discount_thresholds FOR UPDATE
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

-- Policy 4: Allow only admins to DELETE discount thresholds
CREATE POLICY "Only admins can delete discount thresholds"
ON discount_thresholds FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- ==============================
-- Pricing Calculations RLS Policies
-- ==============================

-- Policy 1: Allow authenticated users to SELECT pricing calculations
CREATE POLICY "Authenticated users can view pricing calculations"
ON pricing_calculations FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow service role to INSERT pricing calculations (via server actions)
CREATE POLICY "Service role can create pricing calculations"
ON pricing_calculations FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- Policy 3: NO UPDATES ALLOWED (immutable)
CREATE POLICY "No updates allowed on pricing calculations"
ON pricing_calculations FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 4: NO DELETES ALLOWED (immutable)
CREATE POLICY "No deletes allowed on pricing calculations"
ON pricing_calculations FOR DELETE
TO authenticated
USING (false);

-- ===========================================
-- ADD TRIGGERS FOR UPDATED_AT
-- ===========================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to pricing_rules
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to discount_thresholds
DROP TRIGGER IF EXISTS update_discount_thresholds_updated_at ON discount_thresholds;
CREATE TRIGGER update_discount_thresholds_updated_at
  BEFORE UPDATE ON discount_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SEED INITIAL DATA
-- ===========================================

-- Insert default pricing rules for all fruit types (disabled by default)
INSERT INTO pricing_rules (fruit_type, quality_based_pricing_enabled, created_by)
VALUES
  ('CAFÉ', false, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('CACAO', false, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('MIEL', false, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('COCOS', false, (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
ON CONFLICT (fruit_type) DO NOTHING;

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can view pricing rules" ON pricing_rules IS 'All authenticated users can view pricing configuration';
COMMENT ON POLICY "Only admins can create pricing rules" ON pricing_rules IS 'Only administrators can create or modify pricing rules';
COMMENT ON POLICY "No updates allowed on pricing calculations" ON pricing_calculations IS 'Pricing calculations are immutable once saved - no updates or deletes allowed';
