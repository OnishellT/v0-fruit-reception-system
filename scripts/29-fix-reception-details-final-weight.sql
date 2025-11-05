-- Migration 29: Fix reception_details to show correct final weight including lab samples
-- Date: 2025-11-01
-- Purpose: Add lab_sample_adjustment field to reception_details and update trigger

-- ===========================================
-- PART 1: ADD LAB SAMPLE ADJUSTMENT FIELD
-- ===========================================

-- Add field for lab sample weight adjustment to reception_details
ALTER TABLE reception_details
ADD COLUMN IF NOT EXISTS lab_sample_adjustment NUMERIC(10,2) DEFAULT 0;

-- ===========================================
-- PART 2: UPDATE TRIGGER FUNCTION
-- ===========================================

-- Update the trigger function to calculate complete final weight
CREATE OR REPLACE FUNCTION apply_quality_discounts(p_recepcion_id UUID)
RETURNS void AS $$
DECLARE
  v_original_weight DECIMAL(10,2) := 0;
  v_total_weight_discount DECIMAL(10,2) := 0;
  v_user_id UUID;

  -- Lab sample adjustments
  v_lab_wet_weight DECIMAL(10,2) := 0;
  v_lab_dried_weight DECIMAL(10,2) := 0;
  v_lab_adjustment DECIMAL(10,2) := 0;

  -- Quality metric values
  v_violetas_val DECIMAL(5,2);
  v_humedad_val DECIMAL(5,2);
  v_moho_val DECIMAL(5,2);

  -- Threshold values
  v_violetas_threshold_max DECIMAL(5,2);
  v_humedad_threshold_max DECIMAL(5,2);
  v_moho_threshold_max DECIMAL(5,2);

  -- Discount amounts
  v_violetas_discount DECIMAL(10,2) := 0;
  v_humedad_discount DECIMAL(10,2) := 0;
  v_moho_discount DECIMAL(10,2) := 0;

BEGIN
  -- Get original weight from reception
  SELECT COALESCE(total_peso_original, 0) INTO v_original_weight
  FROM receptions WHERE id = p_recepcion_id;

  -- If total_peso_original is 0, calculate from reception_details
  IF v_original_weight = 0 THEN
    SELECT COALESCE(SUM(original_weight), 0) INTO v_original_weight
    FROM reception_details WHERE reception_id = p_recepcion_id;

    -- Update the reception with calculated original weight
    UPDATE receptions SET
      total_peso_original = v_original_weight,
      updated_at = NOW()
    WHERE id = p_recepcion_id;
  END IF;

  -- Get lab sample weights
  SELECT
    COALESCE(lab_sample_wet_weight, 0),
    COALESCE(lab_sample_dried_weight, 0)
  INTO
    v_lab_wet_weight,
    v_lab_dried_weight
  FROM receptions WHERE id = p_recepcion_id;

  -- Calculate lab sample adjustment (dried - wet = gain or loss)
  v_lab_adjustment := v_lab_dried_weight - v_lab_wet_weight;

  -- Get quality evaluation data
  SELECT violetas, humedad, moho, created_by INTO v_violetas_val, v_humedad_val, v_moho_val, v_user_id
  FROM quality_evaluations WHERE recepcion_id = p_recepcion_id;

  -- Get thresholds from discount_thresholds
  SELECT
    dt_violetas.max_value,
    dt_humedad.max_value,
    dt_moho.max_value,
    dt_violetas.discount_percentage,
    dt_humedad.discount_percentage,
    dt_moho.discount_percentage
  INTO
    v_violetas_threshold_max,
    v_humedad_threshold_max,
    v_moho_threshold_max,
    v_violetas_discount,
    v_humedad_discount,
    v_moho_discount
  FROM discount_thresholds dt_violetas
  LEFT JOIN discount_thresholds dt_humedad ON dt_humedad.quality_metric = 'Humedad' AND dt_humedad.pricing_rule_id = dt_violetas.pricing_rule_id
  LEFT JOIN discount_thresholds dt_moho ON dt_moho.quality_metric = 'Moho' AND dt_moho.pricing_rule_id = dt_violetas.pricing_rule_id
  WHERE dt_violetas.quality_metric = 'Violetas'
  LIMIT 1;

  -- Calculate individual discounts
  IF v_violetas_val IS NOT NULL AND v_violetas_discount > 0 AND v_violetas_val > v_violetas_threshold_max THEN
    v_violetas_discount := v_original_weight * v_violetas_discount / 100;
  ELSE
    v_violetas_discount := 0;
  END IF;

  IF v_humedad_val IS NOT NULL AND v_humedad_discount > 0 AND v_humedad_val > v_humedad_threshold_max THEN
    v_humedad_discount := v_original_weight * v_humedad_discount / 100;
  ELSE
    v_humedad_discount := 0;
  END IF;

  IF v_moho_val IS NOT NULL AND v_moho_discount > 0 AND v_moho_val > v_moho_threshold_max THEN
    v_moho_discount := v_original_weight * v_moho_discount / 100;
  ELSE
    v_moho_discount := 0;
  END IF;

  -- Calculate total discount
  v_total_weight_discount := v_violetas_discount + v_humedad_discount + v_moho_discount;

  -- Clear existing discount breakdown for this reception
  DELETE FROM desglose_descuentos WHERE recepcion_id = p_recepcion_id;

  -- If user_id is still null, use a default system user or skip
  IF v_user_id IS NULL THEN
    -- Get any active admin user as fallback
    SELECT id INTO v_user_id
    FROM users
    WHERE role = 'admin' AND is_active = true
    LIMIT 1;

    -- If still null, use a placeholder UUID (not ideal but prevents errors)
    IF v_user_id IS NULL THEN
      v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
  END IF;

  -- Insert discount breakdown for Violetas
  IF v_violetas_val IS NOT NULL AND v_violetas_discount > 0 THEN
    INSERT INTO desglose_descuentos (
      recepcion_id,
      parametro,
      umbral,
      valor,
      porcentaje_descuento,
      peso_descuento,
      created_by
    ) VALUES (
      p_recepcion_id,
      'Violetas',
      v_violetas_threshold_max,
      v_violetas_val,
      v_violetas_discount,
      v_violetas_discount,
      v_user_id
    );
  END IF;

  -- Insert discount breakdown for Humedad
  IF v_humedad_val IS NOT NULL AND v_humedad_discount > 0 THEN
    INSERT INTO desglose_descuentos (
      recepcion_id,
      parametro,
      umbral,
      valor,
      porcentaje_descuento,
      peso_descuento,
      created_by
    ) VALUES (
      p_recepcion_id,
      'Humedad',
      v_humedad_threshold_max,
      v_humedad_val,
      v_humedad_discount,
      v_humedad_discount,
      v_user_id
    );
  END IF;

  -- Insert discount breakdown for Moho
  IF v_moho_val IS NOT NULL AND v_moho_discount > 0 THEN
    INSERT INTO desglose_descuentos (
      recepcion_id,
      parametro,
      umbral,
      valor,
      porcentaje_descuento,
      peso_descuento,
      created_by
    ) VALUES (
      p_recepcion_id,
      'Moho',
      v_moho_threshold_max,
      v_moho_val,
      v_moho_discount,
      v_moho_discount,
      v_user_id
    );
  END IF;

  -- Update reception with discount totals
  -- Formula: total_peso_final = original - quality_discounts + lab_adjustment
  UPDATE receptions SET
    total_peso_descuento = v_total_weight_discount,
    total_peso_final = COALESCE(total_peso_original, v_original_weight)
                      - v_total_weight_discount
                      + v_lab_adjustment,
    updated_at = NOW()
  WHERE id = p_recepcion_id;

  -- Update reception_details with COMPLETE discount calculations
  -- Each detail gets a proportional share of quality discounts + lab sample adjustment
  IF v_original_weight > 0 THEN
    UPDATE reception_details SET
      -- Proportional lab sample adjustment for each detail
      lab_sample_adjustment = (original_weight / v_original_weight) * v_lab_adjustment,
      -- Quality discount for each detail
      discounted_weight = original_weight - (original_weight * v_total_weight_discount / v_original_weight),
      -- Total discount percentage (quality only, lab is handled separately)
      discount_percentage = (v_total_weight_discount / v_original_weight) * 100
    WHERE reception_id = p_recepcion_id;
  END IF;

  RAISE NOTICE 'Applied quality discounts for reception %: total discount = % kg, lab adjustment = % kg',
    p_recepcion_id, v_total_weight_discount, v_lab_adjustment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION apply_quality_discounts(UUID) TO authenticated;

-- ===========================================
-- PART 3: UPDATE RECEPTIONS WHEN LAB SAMPLES CHANGE
-- ===========================================

-- Create a function to handle lab sample updates
CREATE OR REPLACE FUNCTION apply_lab_sample_adjustment(p_recepcion_id UUID)
RETURNS void AS $$
DECLARE
  v_original_weight DECIMAL(10,2) := 0;
  v_total_weight_discount DECIMAL(10,2) := 0;
  v_lab_wet_weight DECIMAL(10,2) := 0;
  v_lab_dried_weight DECIMAL(10,2) := 0;
  v_lab_adjustment DECIMAL(10,2) := 0;
BEGIN
  -- Get values from reception
  SELECT
    COALESCE(total_peso_original, 0),
    COALESCE(total_peso_descuento, 0),
    COALESCE(lab_sample_wet_weight, 0),
    COALESCE(lab_sample_dried_weight, 0)
  INTO
    v_original_weight,
    v_total_weight_discount,
    v_lab_wet_weight,
    v_lab_dried_weight
  FROM receptions WHERE id = p_recepcion_id;

  -- Calculate lab sample adjustment
  v_lab_adjustment := v_lab_dried_weight - v_lab_wet_weight;

  -- Update reception with new final weight
  UPDATE receptions SET
    total_peso_final = v_original_weight - v_total_weight_discount + v_lab_adjustment,
    updated_at = NOW()
  WHERE id = p_recepcion_id;

  -- Update reception_details with lab sample adjustment
  IF v_original_weight > 0 THEN
    UPDATE reception_details SET
      lab_sample_adjustment = (original_weight / v_original_weight) * v_lab_adjustment
    WHERE reception_id = p_recepcion_id;
  END IF;

  RAISE NOTICE 'Applied lab sample adjustment for reception %: adjustment = % kg',
    p_recepcion_id, v_lab_adjustment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lab sample updates
DROP TRIGGER IF EXISTS apply_lab_sample_trigger ON receptions;
CREATE TRIGGER apply_lab_sample_trigger
  AFTER UPDATE OF lab_sample_wet_weight, lab_sample_dried_weight ON receptions
  FOR EACH ROW
  WHEN (OLD.lab_sample_wet_weight IS DISTINCT FROM NEW.lab_sample_wet_weight
        OR OLD.lab_sample_dried_weight IS DISTINCT FROM NEW.lab_sample_dried_weight)
  EXECUTE FUNCTION apply_lab_sample_adjustment();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION apply_lab_sample_adjustment(UUID) TO authenticated;

-- ===========================================
-- PART 4: COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 29 completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: reception_details now shows complete final weight';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  1. Added lab_sample_adjustment field to reception_details';
  RAISE NOTICE '  2. Updated trigger to calculate quality + lab sample adjustments';
  RAISE NOTICE '  3. Created lab sample trigger for real-time updates';
  RAISE NOTICE '';
  RAISE NOTICE 'Formula: final_weight = original - quality_discounts + lab_adjustment';
  RAISE NOTICE '';
  RAISE NOTICE 'The details table will now show correct final weights!';
END $$;
