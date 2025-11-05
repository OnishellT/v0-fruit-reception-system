-- Migration 24: Simplify check constraint to allow lab sample adjustments
-- Date: 2025-11-01
-- Purpose: Update chk_peso_calculation to be more flexible with lab samples

-- ===========================================
-- DROP EXISTING CONSTRAINT
-- ===========================================

ALTER TABLE receptions DROP CONSTRAINT IF EXISTS chk_peso_calculation;

-- ===========================================
-- ADD SIMPLER CONSTRAINT
-- ===========================================

-- Allow total_peso_final to differ from the basic calculation
-- as long as both are non-negative
ALTER TABLE receptions
ADD CONSTRAINT chk_peso_calculation CHECK (
  total_peso_final >= 0
);

-- ===========================================
-- MIGRATION COMPLETION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 24 completed successfully: Check constraint simplified';
  RAISE NOTICE '- Removed strict formula constraint';
  RAISE NOTICE '- Now only checks that total_peso_final is non-negative';
  RAISE NOTICE '- Lab sample adjustments can now work without constraint violations';
END $$;
