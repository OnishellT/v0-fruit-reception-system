-- Migration 22: Update apply_quality_discounts function to update reception_details
-- Date: 2025-11-01
-- Purpose: Fix reception details table to show weight discounts in the UI

-- Update the apply_quality_discounts function to also update reception_details
CREATE OR REPLACE FUNCTION apply_quality_discounts(
  p_recepcion_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_total_weight_discount DECIMAL(10,2) := 0;
  v_original_weight DECIMAL(10,2);
  v_violetas_val DECIMAL(5,2);
  v_humedad_val DECIMAL(5,2);
  v_moho_val DECIMAL(5,2);
  v_violetas_discount DECIMAL(10,2);
  v_humedad_discount DECIMAL(10,2);
  v_moho_discount DECIMAL(10,2);
  v_violetas_threshold_min DECIMAL(5,2);
  v_violetas_threshold_max DECIMAL(5,2);
  v_humedad_threshold_min DECIMAL(5,2);
  v_humedad_threshold_max DECIMAL(5,2);
  v_moho_threshold_min DECIMAL(5,2);
  v_moho_threshold_max DECIMAL(5,2);
  v_user_id UUID;
BEGIN
  -- Get user ID from the quality evaluation record (created_by or updated_by)
  SELECT created_by INTO v_user_id
  FROM quality_evaluations
  WHERE recepcion_id = p_recepcion_id
  LIMIT 1;

  -- If not found, try updated_by
  IF v_user_id IS NULL THEN
    SELECT updated_by INTO v_user_id
    FROM quality_evaluations
    WHERE recepcion_id = p_recepcion_id
    LIMIT 1;
  END IF;

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

  -- Get quality evaluation data
  SELECT
    violetas,
    humedad,
    moho
  INTO
    v_violetas_val,
    v_humedad_val,
    v_moho_val
  FROM quality_evaluations
  WHERE recepcion_id = p_recepcion_id;

  -- If no quality data, exit
  IF NOT FOUND THEN
    RAISE NOTICE 'No quality evaluation found for reception %', p_recepcion_id;
    RETURN;
  END IF;

  -- Get original weight (use total_peso_original if exists, otherwise calculate from reception_details)
  SELECT COALESCE(total_peso_original, 0) INTO v_original_weight
  FROM receptions WHERE id = p_recepcion_id;

  -- If total_peso_original is 0, calculate from reception_details
  IF v_original_weight = 0 THEN
    SELECT COALESCE(SUM(weight_kg), 0) INTO v_original_weight
    FROM reception_details
    WHERE reception_id = p_recepcion_id;
  END IF;

  -- Calculate discounts from the view
  SELECT
    COALESCE(violetas_weight_discount, 0),
    COALESCE(humedad_weight_discount, 0),
    COALESCE(moho_weight_discount, 0),
    COALESCE(violetas_discount_pct, 0),
    COALESCE(humedad_discount_pct, 0),
    COALESCE(moho_discount_pct, 0),
    COALESCE(violetas_threshold_min, 0),
    COALESCE(violetas_threshold_max, 0),
    COALESCE(humedad_threshold_min, 0),
    COALESCE(humedad_threshold_max, 0),
    COALESCE(moho_threshold_min, 0),
    COALESCE(moho_threshold_max, 0)
  INTO
    v_violetas_discount,
    v_humedad_discount,
    v_moho_discount,
    v_violetas_discount,
    v_humedad_discount,
    v_moho_discount,
    v_violetas_threshold_min,
    v_violetas_threshold_max,
    v_humedad_threshold_min,
    v_humedad_threshold_max,
    v_moho_threshold_min,
    v_moho_threshold_max
  FROM quality_discount_calculations
  WHERE recepcion_id = p_recepcion_id;

  -- Calculate total discount
  v_total_weight_discount := v_violetas_discount + v_humedad_discount + v_moho_discount;

  -- Clear existing discount breakdown for this reception
  DELETE FROM desglose_descuentos WHERE recepcion_id = p_recepcion_id;

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
  -- CRITICAL: Do NOT modify total_peso_original - it's the static baseline
  -- total_peso_final must account for lab samples: original - discounts + (dried - wet)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION apply_quality_discounts(UUID) TO authenticated;

-- ===========================================
-- MIGRATION COMPLETION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 22 completed successfully: apply_quality_discounts function updated';
  RAISE NOTICE '- Function now updates reception_details table with discount calculations';
  RAISE NOTICE '- Original weight, discounted weight, and discount percentage are now properly calculated';
  RAISE NOTICE '- Reception details view will now display correct weight values';
END $$;
