-- Migration 32: Fix trigger to get correct threshold values
-- Date: 2025-11-01
-- Purpose: Fix trigger logic to properly get thresholds for each metric

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

  -- Individual threshold and discount values
  v_violetas_discount_pct DECIMAL(5,2) := 0;
  v_humedad_discount_pct DECIMAL(5,2) := 0;
  v_moho_discount_pct DECIMAL(5,2) := 0;

  -- Individual discount amounts
  v_violetas_discount DECIMAL(10,2) := 0;
  v_humedad_discount DECIMAL(10,2) := 0;
  v_moho_discount DECIMAL(10,2) := 0;

BEGIN
  -- Get original weight from reception
  SELECT COALESCE(total_peso_original, 0) INTO v_original_weight
  FROM receptions WHERE id = p_recepcion_id;

  -- If total_peso_original is 0, calculate from reception_details using weight_kg
  IF v_original_weight = 0 THEN
    SELECT COALESCE(SUM(COALESCE(NULLIF(original_weight, 0), weight_kg)), 0) INTO v_original_weight
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

  -- Get thresholds for each metric separately to avoid JOIN issues
  -- Violetas: Get the highest discount percentage that the value exceeds
  SELECT dt.discount_percentage INTO v_violetas_discount_pct
  FROM discount_thresholds dt
  JOIN pricing_rules pr ON dt.pricing_rule_id = pr.id
  WHERE dt.quality_metric = 'Violetas'
    AND pr.fruit_type = (SELECT ft.type FROM fruit_types ft WHERE ft.id = (SELECT fruit_type_id FROM receptions WHERE id = p_recepcion_id))
    AND v_violetas_val > dt.min_value
    AND v_violetas_val <= dt.max_value
  ORDER BY dt.discount_percentage DESC
  LIMIT 1;

  -- Humedad
  SELECT dt.discount_percentage INTO v_humedad_discount_pct
  FROM discount_thresholds dt
  JOIN pricing_rules pr ON dt.pricing_rule_id = pr.id
  WHERE dt.quality_metric = 'Humedad'
    AND pr.fruit_type = (SELECT ft.type FROM fruit_types ft WHERE ft.id = (SELECT fruit_type_id FROM receptions WHERE id = p_recepcion_id))
    AND v_humedad_val > dt.min_value
    AND v_humedad_val <= dt.max_value
  ORDER BY dt.discount_percentage DESC
  LIMIT 1;

  -- Moho
  SELECT dt.discount_percentage INTO v_moho_discount_pct
  FROM discount_thresholds dt
  JOIN pricing_rules pr ON dt.pricing_rule_id = pr.id
  WHERE dt.quality_metric = 'Moho'
    AND pr.fruit_type = (SELECT ft.type FROM fruit_types ft WHERE ft.id = (SELECT fruit_type_id FROM receptions WHERE id = p_recepcion_id))
    AND v_moho_val > dt.min_value
    AND v_moho_val <= dt.max_value
  ORDER BY dt.discount_percentage DESC
  LIMIT 1;

  -- Calculate individual discounts based on threshold percentages
  IF v_violetas_val IS NOT NULL AND v_violetas_discount_pct > 0 THEN
    v_violetas_discount := v_original_weight * v_violetas_discount_pct / 100;
  ELSE
    v_violetas_discount := 0;
  END IF;

  IF v_humedad_val IS NOT NULL AND v_humedad_discount_pct > 0 THEN
    v_humedad_discount := v_original_weight * v_humedad_discount_pct / 100;
  ELSE
    v_humedad_discount := 0;
  END IF;

  IF v_moho_val IS NOT NULL AND v_moho_discount_pct > 0 THEN
    v_moho_discount := v_original_weight * v_moho_discount_pct / 100;
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
      v_violetas_discount_pct,
      v_violetas_val,
      v_violetas_discount_pct,
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
      v_humedad_discount_pct,
      v_humedad_val,
      v_humedad_discount_pct,
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
      v_moho_discount_pct,
      v_moho_val,
      v_moho_discount_pct,
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
      -- Ensure original_weight is populated (use weight_kg if NULL or 0)
      original_weight = COALESCE(NULLIF(original_weight, 0), weight_kg),
      -- Proportional lab sample adjustment for each detail
      lab_sample_adjustment = (COALESCE(NULLIF(original_weight, 0), weight_kg) / v_original_weight) * v_lab_adjustment,
      -- Quality discount for each detail
      discounted_weight = COALESCE(NULLIF(original_weight, 0), weight_kg) - (COALESCE(NULLIF(original_weight, 0), weight_kg) * v_total_weight_discount / v_original_weight),
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

DO $$
BEGIN
  RAISE NOTICE 'Migration 32 completed - trigger now queries thresholds correctly';
END $$;
