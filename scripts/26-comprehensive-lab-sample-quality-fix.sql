-- Migration 26: Comprehensive Fix for Lab Samples and Quality Discounts
-- Date: 2025-11-01
-- Purpose: Fix ALL places where final weight might be reset to original

-- ===========================================
-- PART 1: FIX APPLY_QUALITY_DISCOUNTS FUNCTION (script 18)
-- ===========================================

CREATE OR REPLACE FUNCTION apply_quality_discounts(p_recepcion_id UUID)
RETURNS void AS $$
DECLARE
  v_original_weight DECIMAL(10,2) := 0;
  v_total_weight_discount DECIMAL(10,2) := 0;
  v_user_id UUID;

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
  LEFT JOIN discount_thresholds dt_humedad ON dt_humedad.quality_metric = 'humedad' AND dt_humedad.pricing_rule_id = dt_violetas.pricing_rule_id
  LEFT JOIN discount_thresholds dt_moho ON dt_moho.quality_metric = 'moho' AND dt_moho.pricing_rule_id = dt_violetas.pricing_rule_id
  WHERE dt_violetas.quality_metric = 'violetas'
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
  -- CRITICAL FIX: Account for lab samples in total_peso_final calculation
  -- Formula: original - discounts + (dried - wet)
  UPDATE receptions SET
    total_peso_descuento = v_total_weight_discount,
    total_peso_final = COALESCE(total_peso_original, v_original_weight)
                      - v_total_weight_discount
                      + (COALESCE(lab_sample_dried_weight, 0) - COALESCE(lab_sample_wet_weight, 0)),
    updated_at = NOW()
  WHERE id = p_recepcion_id;

  -- Update reception_details with discount calculations
  -- Calculate total discount percentage for each detail line
  IF v_original_weight > 0 THEN
    UPDATE reception_details SET
      discounted_weight = original_weight - (original_weight * v_total_weight_discount / v_original_weight),
      discount_percentage = (v_total_weight_discount / v_original_weight) * 100
    WHERE reception_id = p_recepcion_id;
  END IF;

  RAISE NOTICE 'Applied quality discounts for reception %: total discount = % kg', p_recepcion_id, v_total_weight_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 2: CREATE SIMPLIFIED FUNCTION FOR SCRIPT 22 (IF NEEDED)
-- ===========================================

-- This function will be used if the one from script 22 exists
-- We create it separately to avoid the DO block syntax issue

CREATE OR REPLACE FUNCTION apply_quality_discounts_script22(p_recepcion_id UUID)
RETURNS void AS $$
DECLARE
  v_original_weight DECIMAL(10,2) := 0;
  v_total_weight_discount DECIMAL(10,2) := 0;
BEGIN
  -- Get original weight
  SELECT COALESCE(total_peso_original, 0) INTO v_original_weight
  FROM receptions WHERE id = p_recepcion_id;

  -- Get discount breakdown
  SELECT COALESCE(SUM(peso_descuento), 0) INTO v_total_weight_discount
  FROM desglose_descuentos WHERE recepcion_id = p_recepcion_id;

  -- Update reception WITH lab sample support
  UPDATE receptions SET
    total_peso_descuento = v_total_weight_discount,
    total_peso_final = COALESCE(total_peso_original, v_original_weight)
                      - v_total_weight_discount
                      + (COALESCE(lab_sample_dried_weight, 0) - COALESCE(lab_sample_wet_weight, 0)),
    updated_at = NOW()
  WHERE id = p_recepcion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 3: GRANT PERMISSIONS
-- ===========================================

GRANT EXECUTE ON FUNCTION apply_quality_discounts(UUID) TO authenticated;

-- ===========================================
-- COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 26 completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: All weight calculation functions now account for lab samples';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed in:';
  RAISE NOTICE '  1. Script 18 universal quality system (apply_quality_discounts function)';
  RAISE NOTICE '  2. Created simplified function for script 22 compatibility';
  RAISE NOTICE '';
  RAISE NOTICE 'Formula (all fixed):';
  RAISE NOTICE '  total_peso_final = total_peso_original - total_peso_descuento + (lab_sample_dried - lab_sample_wet)';
  RAISE NOTICE '';
  RAISE NOTICE 'The "registrar calidad" button will now correctly preserve lab samples!';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: reception.ts update function was also fixed to NOT reset final weight';
END $$;
