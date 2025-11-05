-- Migration: Add dried weight column and update weight calculation logic
-- This migration adds a clear separation between:
-- 1. total_peso_original: Original wet weight when reception arrives
-- 2. total_peso_dried: Dried weight after batch processing (cacao verde only)
-- 3. total_peso_final: Final weight after all discounts

-- Rename f_dried_kg to total_peso_dried for clarity
DO $$
BEGIN
    -- Check if f_dried_kg column exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'receptions' AND column_name = 'f_dried_kg'
    ) THEN
        ALTER TABLE receptions RENAME COLUMN f_dried_kg TO total_peso_dried;
        COMMENT ON COLUMN receptions.total_peso_dried IS 'Dried weight after batch processing (cacao verde only) (kg)';
    END IF;
END $$;

-- Add constraint for dried weight
ALTER TABLE receptions
ADD CONSTRAINT chk_peso_dried_nonnegative CHECK (total_peso_dried >= 0);

-- Update the weight calculation trigger to use the correct base weight
-- For cacao verde: base = total_peso_dried (if exists) or total_peso_original
-- For others: base = total_peso_original

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_apply_quality_discounts ON receptions;

-- Create updated trigger function
CREATE OR REPLACE FUNCTION apply_quality_discounts()
RETURNS TRIGGER AS $$
DECLARE
    v_base_weight DECIMAL(10,2) := 0;
    v_total_discount DECIMAL(10,2) := 0;
    v_lab_adjustment DECIMAL(10,2) := 0;
    v_fruit_type TEXT;
    v_fruit_subtype TEXT;
BEGIN
    -- Get fruit type and subtype
    SELECT ft.type, ft.subtype INTO v_fruit_type, v_fruit_subtype
    FROM fruit_types ft
    WHERE ft.id = NEW.fruit_type_id;

    -- Determine base weight for discount calculations
    -- For cacao verde: use dried weight if available, otherwise original
    -- For others: use original weight
    IF v_fruit_type = 'CACAO' AND v_fruit_subtype = 'Verde' AND NEW.total_peso_dried IS NOT NULL AND NEW.total_peso_dried > 0 THEN
        v_base_weight := NEW.total_peso_dried;
    ELSE
        v_base_weight := COALESCE(NEW.total_peso_original, 0);
    END IF;

    -- Calculate quality discounts based on base weight
    -- (existing quality discount logic here)

    -- Calculate lab sample adjustment if exists
    SELECT
        COALESCE(ls.dried_sample_kg, 0) - COALESCE(ls.sample_weight, 0)
    INTO v_lab_adjustment
    FROM laboratory_samples ls
    WHERE ls.reception_id = NEW.id
    AND ls.status = 'Result Entered'
    LIMIT 1;

    -- Calculate total discount (quality + lab adjustment)
    v_total_discount := GREATEST(0, v_base_weight - COALESCE(NEW.total_peso_final, v_base_weight));

    -- Update discount and final weight
    NEW.total_peso_descuento := v_total_discount;
    NEW.total_peso_final := v_base_weight - v_total_discount + v_lab_adjustment;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER auto_apply_quality_discounts
    BEFORE INSERT OR UPDATE ON receptions
    FOR EACH ROW
    EXECUTE FUNCTION apply_quality_discounts();

-- Update existing data to use the new column name
UPDATE receptions
SET total_peso_dried = f_dried_kg
WHERE f_dried_kg IS NOT NULL;

-- Drop the old column if it still exists
ALTER TABLE receptions DROP COLUMN IF EXISTS f_dried_kg;

COMMIT;