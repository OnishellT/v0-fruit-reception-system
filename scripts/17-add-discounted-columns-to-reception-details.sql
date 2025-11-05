-- Migration 17: Add Discounted Weight Columns to Reception Details
-- Adds original_weight, discounted_weight, and total_discounted columns
-- Date: 2025-10-31

-- ===========================================
-- ADD DISCOUNTED WEIGHT COLUMNS TO RECEPTION_DETAILS
-- ===========================================

ALTER TABLE reception_details
ADD COLUMN original_weight DECIMAL(10,2) DEFAULT 0,
ADD COLUMN discounted_weight DECIMAL(10,2) DEFAULT 0,
ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0;

-- Add comments to document new fields
COMMENT ON COLUMN reception_details.original_weight IS 'Peso original antes de descuentos (kg)';
COMMENT ON COLUMN reception_details.discounted_weight IS 'Peso final después de aplicar descuentos (kg)';
COMMENT ON COLUMN reception_details.discount_percentage IS 'Porcentaje total de descuento aplicado a esta línea';

-- ===========================================
-- ADD CONSTRAINTS
-- ===========================================

-- Ensure weights are non-negative
ALTER TABLE reception_details
ADD CONSTRAINT chk_original_weight_nonnegative CHECK (original_weight >= 0),
ADD CONSTRAINT chk_discounted_weight_nonnegative CHECK (discounted_weight >= 0),
ADD CONSTRAINT chk_discount_percentage_range CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Ensure discounted weight doesn't exceed original weight
ALTER TABLE reception_details
ADD CONSTRAINT chk_discounted_weight_logic CHECK (discounted_weight <= original_weight);

-- ===========================================
-- ADD INDEXES
-- ===========================================

CREATE INDEX idx_reception_details_reception_id_discounted
ON reception_details(reception_id, discounted_weight);

CREATE INDEX idx_reception_details_discount_percentage
ON reception_details(discount_percentage);

-- ===========================================
-- UPDATE EXISTING DATA
-- ===========================================

-- Update existing records to set original_weight = weight_kg (current weight)
-- and discounted_weight = weight_kg (no discount yet)
UPDATE reception_details
SET
  original_weight = weight_kg,
  discounted_weight = weight_kg,
  discount_percentage = 0
WHERE original_weight = 0 OR original_weight IS NULL;

-- ===========================================
-- VERIFICATION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 17 completed successfully: Discounted columns added to reception_details';
  RAISE NOTICE '- Added original_weight, discounted_weight, discount_percentage columns';
  RAISE NOTICE '- Updated existing records with current weight values';
  RAISE NOTICE '- Added proper constraints and indexes';
END $$;