-- Migration 37: Fix total discount calculation and display
-- Date: 2025-11-02
-- Purpose: Ensure reception totals are correctly updated and displayed

-- ===========================================
-- PART 1: CREATE RECALCULATION FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION recalculate_reception_totals(p_recepcion_id UUID)
RETURNS void AS $$
DECLARE
  v_total_discount DECIMAL(10,2) := 0;
  v_original_weight DECIMAL(10,2) := 0;
  v_lab_wet DECIMAL(10,2) := 0;
  v_lab_dried DECIMAL(10,2) := 0;
  v_lab_adjustment DECIMAL(10,2) := 0;
  v_final_weight DECIMAL(10,2) := 0;
BEGIN
  -- Get current values
  SELECT
    COALESCE(total_peso_original, 0),
    COALESCE(lab_sample_wet_weight, 0),
    COALESCE(lab_sample_dried_weight, 0)
  INTO
    v_original_weight,
    v_lab_wet,
    v_lab_dried
  FROM receptions WHERE id = p_recepcion_id;

  -- Sum up all discounts from breakdown
  SELECT COALESCE(SUM(peso_descuento), 0)
  INTO v_total_discount
  FROM desglose_descuentos
  WHERE recepcion_id = p_recepcion_id;

  -- Calculate lab adjustment (dried - wet)
  v_lab_adjustment := v_lab_dried - v_lab_wet;

  -- Calculate final weight: Original - Discount + Lab Adjustment
  v_final_weight := v_original_weight - v_total_discount + v_lab_adjustment;

  -- Update reception with calculated totals
  UPDATE receptions SET
    total_peso_descuento = v_total_discount,
    total_peso_final = v_final_weight,
    updated_at = NOW()
  WHERE id = p_recepcion_id;

  RAISE NOTICE 'Recalculated totals for reception %: discount=%, final=%',
    p_recepcion_id, v_total_discount, v_final_weight;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION recalculate_reception_totals(UUID) TO authenticated;

-- ===========================================
-- PART 2: FIX TRIGGER TO ALWAYS UPDATE TOTALS
-- ===========================================

-- Update the trigger function to ensure it recalculates totals
CREATE OR REPLACE FUNCTION trigger_lab_sample_quality_update()
RETURNS TRIGGER AS $$
DECLARE
  v_quality_changed BOOLEAN := FALSE;
BEGIN
  -- Check if any of the quality fields changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.violetas_percentage IS DISTINCT FROM NEW.violetas_percentage OR
    OLD.moho_percentage IS DISTINCT FROM NEW.moho_percentage OR
    OLD.basura_percentage IS DISTINCT FROM NEW.basura_percentage OR
    OLD.dried_sample_kg IS DISTINCT FROM NEW.dried_sample_kg
  )) OR (TG_OP = 'INSERT') THEN
    v_quality_changed := TRUE;
  END IF;

  -- Always recalculate totals when lab sample changes
  IF v_quality_changed OR TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    -- First update the lab weights on the reception
    UPDATE receptions SET
      lab_sample_wet_weight = NEW.sample_weight,
      lab_sample_dried_weight = NEW.dried_sample_kg,
      updated_at = NOW()
    WHERE id = NEW.reception_id;

    -- Then apply quality discounts (which will update totals)
    PERFORM apply_quality_discounts(NEW.reception_id);

    -- Finally, ensure totals are correct
    PERFORM recalculate_reception_totals(NEW.reception_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 3: CREATE MANUAL RECALCULATION ENDPOINT FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION manual_recalculate_discounts(p_recepcion_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_original DECIMAL(10,2);
  v_discount DECIMAL(10,2);
  v_final DECIMAL(10,2);
  v_count INTEGER;
BEGIN
  -- Count breakdown entries
  SELECT COUNT(*), COALESCE(SUM(peso_descuento), 0)
  INTO v_count, v_discount
  FROM desglose_descuentos
  WHERE recepcion_id = p_recepcion_id;

  -- Get original weight
  SELECT COALESCE(total_peso_original, 0)
  INTO v_original
  FROM receptions WHERE id = p_recepcion_id;

  -- Recalculate
  PERFORM recalculate_reception_totals(p_recepcion_id);

  -- Get updated values
  SELECT total_peso_descuento, total_peso_final
  INTO v_discount, v_final
  FROM receptions WHERE id = p_recepcion_id;

  -- Return result
  v_result := json_build_object(
    'reception_id', p_recepcion_id,
    'breakdown_count', v_count,
    'original_weight', v_original,
    'total_discount', v_discount,
    'final_weight', v_final,
    'recalculated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION manual_recalculate_discounts(UUID) TO authenticated;

-- ===========================================
-- PART 4: ADD HELPER VIEW FOR DISPLAY
-- ===========================================

-- Create a view that combines reception with calculated totals
CREATE OR REPLACE VIEW reception_totals_with_discounts AS
SELECT
  r.*,
  COALESCE(SUM(dd.peso_descuento), 0) as calculated_total_discount,
  CASE
    WHEN ABS(COALESCE(r.total_peso_descuento, 0) - COALESCE(SUM(dd.peso_descuento), 0)) > 0.01
    THEN 'MISMATCH'
    ELSE 'MATCH'
  END as discount_status
FROM receptions r
LEFT JOIN desglose_descuentos dd ON r.id = dd.recepcion_id
GROUP BY r.id, r.total_peso_descuento;

-- ===========================================
-- PART 5: ADD COMMENTS AND DOCUMENTATION
-- ===========================================

COMMENT ON FUNCTION recalculate_reception_totals(UUID) IS
'Recalculates total_peso_descuento and total_peso_final for a reception based on desglose_descuentos';

COMMENT ON FUNCTION manual_recalculate_discounts(UUID) IS
'Manually recalculates and returns discount totals for debugging';

COMMENT ON VIEW reception_totals_with_discounts IS
'View showing receptions with calculated discount totals and status';

-- ===========================================
-- PART 6: COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 37 completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: Total discount calculation and display';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  1. Created recalculate_reception_totals() function';
  RAISE NOTICE '  2. Updated trigger to always recalculate totals';
  RAISE NOTICE '  3. Created manual recalculation function';
  RAISE NOTICE '  4. Created view for debugging';
  RAISE NOTICE '';
  RAISE NOTICE 'To manually recalculate a reception:';
  RAISE NOTICE '  SELECT manual_recalculate_discounts(''your-reception-id'');';
  RAISE NOTICE '';
  RAISE NOTICE 'To check status:';
  RAISE NOTICE '  SELECT * FROM reception_totals_with_discounts WHERE id = ''your-id'';';
  RAISE NOTICE '';
  RAISE NOTICE 'Now the total discount in the UI will match the breakdown!';
  RAISE NOTICE '';
END $$;
