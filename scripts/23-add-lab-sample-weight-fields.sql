-- Migration 23: Add Laboratory Sample Weight Fields to Receptions
-- Date: 2025-11-01
-- Purpose: Track lab sample wet and dried weights separately from reception totals

-- ===========================================
-- ADD LAB SAMPLE WEIGHT FIELDS TO RECEPTIONS
-- ===========================================

-- Add columns only if they don't exist
DO $$
BEGIN
  -- Add lab_sample_wet_weight if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receptions' AND column_name = 'lab_sample_wet_weight') THEN
    ALTER TABLE receptions ADD COLUMN lab_sample_wet_weight DECIMAL(10,2) DEFAULT 0;
  ELSE
    RAISE NOTICE 'lab_sample_wet_weight column already exists';
  END IF;

  -- Add lab_sample_dried_weight if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receptions' AND column_name = 'lab_sample_dried_weight') THEN
    ALTER TABLE receptions ADD COLUMN lab_sample_dried_weight DECIMAL(10,2) DEFAULT 0;
  ELSE
    RAISE NOTICE 'lab_sample_dried_weight column already exists';
  END IF;
END $$;

-- Add comments to document new fields
COMMENT ON COLUMN receptions.lab_sample_wet_weight IS 'Weight of lab sample when created (kg) - subtracted from available weight';
COMMENT ON COLUMN receptions.lab_sample_dried_weight IS 'Weight of lab sample after drying (kg) - added back to available weight';

-- ===========================================
-- ADD CONSTRAINTS
-- ===========================================

-- Add constraints only if they don't exist
DO $$
BEGIN
  -- Add lab_sample_wet_weight non-negative constraint
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_lab_sample_wet_weight_nonnegative') THEN
    ALTER TABLE receptions ADD CONSTRAINT chk_lab_sample_wet_weight_nonnegative CHECK (lab_sample_wet_weight >= 0);
  END IF;

  -- Add lab_sample_dried_weight non-negative constraint
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_lab_sample_dried_weight_nonnegative') THEN
    ALTER TABLE receptions ADD CONSTRAINT chk_lab_sample_dried_weight_nonnegative CHECK (lab_sample_dried_weight >= 0);
  END IF;

  -- Add dried weight logic constraint
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_lab_sample_dried_weight_logic') THEN
    ALTER TABLE receptions ADD CONSTRAINT chk_lab_sample_dried_weight_logic CHECK (lab_sample_dried_weight <= lab_sample_wet_weight);
  END IF;
END $$;

-- ===========================================
-- ADD INDEXES
-- ===========================================

-- Create index only if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_receptions_lab_sample_weights
ON receptions(lab_sample_wet_weight, lab_sample_dried_weight);

-- ===========================================
-- MIGRATION COMPLETION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 23 completed successfully: Lab sample weight fields verified/added';
  RAISE NOTICE '- lab_sample_wet_weight and lab_sample_dried_weight columns are available';
  RAISE NOTICE '- Proper constraints and indexes are in place';
  RAISE NOTICE '- Lab samples can now track wet and dried weights separately';
END $$;
