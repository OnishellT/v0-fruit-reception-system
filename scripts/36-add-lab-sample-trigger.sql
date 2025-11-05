-- Migration 36: Add trigger for laboratory_samples table
-- Date: 2025-11-02
-- Purpose: Add trigger to automatically apply quality discounts when lab samples are updated

-- ===========================================
-- PART 1: CREATE TRIGGER FUNCTION FOR LAB SAMPLES
-- ===========================================

CREATE OR REPLACE FUNCTION trigger_lab_sample_quality_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when quality metrics are actually set/updated
  -- Check if any of the quality fields changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.violetas_percentage IS DISTINCT FROM NEW.violetas_percentage OR
    OLD.moho_percentage IS DISTINCT FROM NEW.moho_percentage OR
    OLD.basura_percentage IS DISTINCT FROM NEW.basura_percentage OR
    OLD.dried_sample_kg IS DISTINCT FROM NEW.dried_sample_kg
  )) OR (TG_OP = 'INSERT') THEN
    -- Call the apply_quality_discounts function
    PERFORM apply_quality_discounts(NEW.reception_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_lab_sample_quality_update() TO authenticated;

-- ===========================================
-- PART 2: CREATE TRIGGER ON LABORATORY_SAMPLES
-- ===========================================

DROP TRIGGER IF EXISTS auto_apply_quality_discounts_lab_samples ON laboratory_samples;

CREATE TRIGGER auto_apply_quality_discounts_lab_samples
  AFTER INSERT OR UPDATE ON laboratory_samples
  FOR EACH ROW EXECUTE FUNCTION trigger_lab_sample_quality_update();

-- ===========================================
-- PART 3: CREATE ANOTHER TRIGGER FOR RECEPTIONS
-- ===========================================

-- Also add a trigger on receptions table to handle lab sample weight changes
CREATE OR REPLACE FUNCTION trigger_reception_lab_sample_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when lab sample fields change
  IF (TG_OP = 'UPDATE' AND (
    OLD.lab_sample_wet_weight IS DISTINCT FROM NEW.lab_sample_wet_weight OR
    OLD.lab_sample_dried_weight IS DISTINCT FROM NEW.lab_sample_dried_weight
  )) OR (TG_OP = 'INSERT') THEN
    -- Call the apply_quality_discounts function
    PERFORM apply_quality_discounts(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_apply_quality_discounts_receptions ON receptions;

CREATE TRIGGER auto_apply_quality_discounts_receptions
  AFTER INSERT OR UPDATE ON receptions
  FOR EACH ROW EXECUTE FUNCTION trigger_reception_lab_sample_update();

-- ===========================================
-- PART 4: GRANT PERMISSIONS
-- ===========================================

GRANT EXECUTE ON FUNCTION trigger_reception_lab_sample_update() TO authenticated;

-- ===========================================
-- PART 5: COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 36 completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: Triggers added for automatic quality discount calculation';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  1. Created trigger_lab_sample_quality_update() function';
  RAISE NOTICE '  2. Added trigger on laboratory_samples table';
  RAISE NOTICE '  3. Added trigger on receptions table for lab weights';
  RAISE NOTICE '';
  RAISE NOTICE 'Now when you:';
  RAISE NOTICE '  - Update lab sample quality (Violetas, Moho, Basura)';
  RAISE NOTICE '  - Update lab sample dried weight';
  RAISE NOTICE '  - Update reception lab sample weights';
  RAISE NOTICE 'The quality discounts will be automatically calculated!';
  RAISE NOTICE '';
  RAISE NOTICE 'These discounts will appear in the reception details page';
  RAISE NOTICE 'in the "Desglose de Descuentos por Calidad" section.';
  RAISE NOTICE '';
END $$;
