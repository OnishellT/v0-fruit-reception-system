-- Migration: Update database trigger to use threshold-based discount logic
-- This replaces the fixed percentage discounts with dynamic threshold-based calculations

-- Update the apply_quality_discounts function to use threshold-based logic
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

  -- Threshold values (limit_value from discount_thresholds table)
  v_violetas_threshold DECIMAL(5,2);
  v_humedad_threshold DECIMAL(5,2);
  v_moho_threshold DECIMAL(5,2);

  -- Discount amounts
  v_violetas_discount DECIMAL(10,2) := 0;
  v_humedad_discount DECIMAL(10,2) := 0;
  v_moho_discount DECIMAL(10,2) := 0;

  -- Fruit type for threshold lookup
  v_fruit_type TEXT;

BEGIN
  -- Get fruit type from reception
  SELECT ft.type INTO v_fruit_type
  FROM receptions r
  JOIN fruit_types ft ON r.fruit_type_id = ft.id
  WHERE r.id = p_recepcion_id;

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

  -- Get thresholds from discount_thresholds using new limit_value column
  SELECT
    dt_violetas.limit_value,
    dt_humedad.limit_value,
    dt_moho.limit_value
  INTO
    v_violetas_threshold,
    v_humedad_threshold,
    v_moho_threshold
  FROM discount_thresholds dt_violetas
  LEFT JOIN discount_thresholds dt_humedad ON dt_humedad.quality_metric = 'Humedad' AND dt_humedad.pricing_rule_id = dt_violetas.pricing_rule_id
  LEFT JOIN discount_thresholds dt_moho ON dt_moho.quality_metric = 'Moho' AND dt_moho.pricing_rule_id = dt_violetas.pricing_rule_id
  WHERE dt_violetas.quality_metric = 'Violetas'
  AND dt_violetas.pricing_rule_id IN (
    SELECT id FROM pricing_rules WHERE fruit_type = v_fruit_type AND quality_based_pricing_enabled = true
  )
  LIMIT 1;

  -- Calculate individual discounts using threshold-based logic
  -- NEW LOGIC: discount_percentage = quality_value - threshold_limit
  IF v_violetas_val IS NOT NULL AND v_violetas_threshold IS NOT NULL AND v_violetas_val > v_violetas_threshold THEN
    v_violetas_discount := v_original_weight * (v_violetas_val - v_violetas_threshold) / 100;
  ELSE
    v_violetas_discount := 0;
  END IF;

  IF v_humedad_val IS NOT NULL AND v_humedad_threshold IS NOT NULL AND v_humedad_val > v_humedad_threshold THEN
    v_humedad_discount := v_original_weight * (v_humedad_val - v_humedad_threshold) / 100;
  ELSE
    v_humedad_discount := 0;
  END IF;

  IF v_moho_val IS NOT NULL AND v_moho_threshold IS NOT NULL AND v_moho_val > v_moho_threshold THEN
    v_moho_discount := v_original_weight * (v_moho_val - v_moho_threshold) / 100;
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
      'Violetas (Evaluación)',
      v_violetas_threshold,
      v_violetas_val,
      (v_violetas_val - v_violetas_threshold), -- percentage discount
      v_violetas_discount, -- weight discount in kg
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
      'Humedad (Evaluación)',
      v_humedad_threshold,
      v_humedad_val,
      (v_humedad_val - v_humedad_threshold), -- percentage discount
      v_humedad_discount, -- weight discount in kg
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
      'Moho (Evaluación)',
      v_moho_threshold,
      v_moho_val,
      (v_moho_val - v_moho_threshold), -- percentage discount
      v_moho_discount, -- weight discount in kg
      v_user_id
    );
  END IF;

  -- Update reception with calculated discounts
  UPDATE receptions SET
    total_peso_descuento = v_total_weight_discount,
    total_peso_final = v_original_weight - v_total_weight_discount,
    updated_at = NOW()
  WHERE id = p_recepcion_id;

  -- Log the calculation
  RAISE NOTICE 'Applied threshold-based discounts for reception %: total_discount=%, final_weight=%', p_recepcion_id, v_total_weight_discount, (v_original_weight - v_total_weight_discount);

END;
$$ LANGUAGE plpgsql;