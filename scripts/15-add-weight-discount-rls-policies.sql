-- Migration 15: Add RLS Policies for Weight Discount System
-- Fixes the data persistence issue in desglose_descuentos table
-- Date: 2025-10-31

-- ===========================================
-- DROP TEMPORARY POLICIES IF THEY EXIST
-- ===========================================

-- Drop any existing restrictive policies that might be blocking access
DROP POLICY IF EXISTS "Users can view own discount breakdowns" ON desglose_descuentos;
DROP POLICY IF EXISTS "Users can insert discount breakdowns for own receptions" ON desglose_descuentos;
DROP POLICY IF EXISTS "Users can update own discount breakdowns" ON desglose_descuentos;
DROP POLICY IF EXISTS "Admins can view all discount breakdowns" ON desglose_descuentos;

-- ===========================================
-- CREATE RLS POLICIES FOR DESGLOSE_DESCUENTOS
-- ===========================================

-- Policy for authenticated users to insert discount breakdowns
-- This is the key policy that will fix the data persistence issue
CREATE POLICY "Allow authenticated users to insert discount breakdowns" ON desglose_descuentos
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy for users to view discount breakdowns for receptions they created
CREATE POLICY "Users can view discount breakdowns" ON desglose_descuentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM receptions
    WHERE receptions.id = desglose_descuentos.recepcion_id
    AND receptions.created_by = auth.uid()
  )
);

-- Policy for users to update discount breakdowns for receptions they created
CREATE POLICY "Users can update own discount breakdowns" ON desglose_descuentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM receptions
    WHERE receptions.id = desglose_descuentos.recepcion_id
    AND receptions.created_by = auth.uid()
  )
);

-- ===========================================
-- CREATE RLS POLICIES FOR WEIGHT DISCOUNT CALCULATIONS TABLE
-- ===========================================

-- Check if the weight_discount_calculations table exists
-- (It should have been created by the pricing system)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'weight_discount_calculations') THEN

    -- Drop any existing restrictive policies
    DROP POLICY IF EXISTS "Users can view own weight discount calculations" ON weight_discount_calculations;
    DROP POLICY IF EXISTS "Users can insert weight discount calculations" ON weight_discount_calculations;

    -- Create policies for weight_discount_calculations table
    CREATE POLICY "Allow authenticated users to insert weight discount calculations" ON weight_discount_calculations
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can view own weight discount calculations" ON weight_discount_calculations
    FOR SELECT
    USING (created_by = auth.uid());

  END IF;
END $$;

-- ===========================================
-- UPDATE RECEPTIONS TABLE RLS POLICIES
-- ===========================================

-- Update receptions table policies to allow users to update weight discount fields
DROP POLICY IF EXISTS "Users can update own receptions" ON receptions;

CREATE POLICY "Users can update own receptions" ON receptions
FOR UPDATE
USING (created_by = auth.uid());

-- ===========================================
-- GRANT NECESSARY PERMISSIONS
-- ===========================================

-- Grant permissions on desglose_descuentos table
GRANT SELECT, INSERT, UPDATE ON desglose_descuentos TO authenticated;

-- Grant permissions on sequences if needed (check if sequence exists first)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'desglose_descuentos_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE desglose_descuentos_id_seq TO authenticated;
  END IF;
END $$;

-- ===========================================
-- VERIFICATION AND TESTING
-- ===========================================

-- Log policy creation
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully for weight discount system';
  RAISE NOTICE '- Users can now insert discount breakdown data';
  RAISE NOTICE '- Users can view discount breakdowns for their own receptions';
  RAISE NOTICE '- Data persistence issue should now be resolved';
END $$;
