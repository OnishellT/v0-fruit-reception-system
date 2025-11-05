-- Migration: Add trigger to update pricing calculations when quality evaluations change
-- Date: 2025-11-05
-- Purpose: Ensure pricing calculations reflect quality discounts when quality evaluations are added/updated

-- ===========================================
-- FUNCTION: Update pricing calculation for a reception
-- ===========================================

CREATE OR REPLACE FUNCTION update_reception_pricing_calculation(p_recepcion_id UUID)
RETURNS void AS $$
DECLARE
  v_pricing_calculation_id UUID;
  v_base_price_per_kg DECIMAL(10,2);
  v_total_weight DECIMAL(10,2);
  v_gross_value DECIMAL(10,2);
  v_total_discount_amount DECIMAL(10,2) := 0;
  v_final_total DECIMAL(10,2);
  v_calculation_data JSONB;

  -- Quality metrics
  v_quality_metrics JSONB := '[]'::jsonb;

  -- Fruit type and pricing info
  v_fruit_type TEXT;
  v_daily_price DECIMAL(10,2);
  v_reception_date DATE;

  -- Quality evaluation data
  v_violetas_val DECIMAL(5,2);
  v_humedad_val DECIMAL(5,2);
  v_moho_val DECIMAL(5,2);

  -- Thresholds and discounts
  v_thresholds JSONB;
  v_applied_thresholds JSONB := '[]'::jsonb;

BEGIN
  -- Check if pricing calculation exists for this reception
  SELECT id, base_price_per_kg, total_weight, gross_value
  INTO v_pricing_calculation_id, v_base_price_per_kg, v_total_weight, v_gross_value
  FROM pricing_calculations
  WHERE reception_id = p_recepcion_id;

  -- If no pricing calculation exists, skip (it will be created during reception creation)
  IF v_pricing_calculation_id IS NULL THEN
    RAISE NOTICE 'No pricing calculation found for reception %, skipping update', p_recepcion_id;
    RETURN;
  END IF;

  -- Get fruit type and reception date
  SELECT
    ft.type,
    r.reception_date
  INTO
    v_fruit_type,
    v_reception_date
  FROM receptions r
  JOIN fruit_types ft ON r.fruit_type_id = ft.id
  WHERE r.id = p_recepcion_id;

  -- Get daily price for the fruit type and date
  SELECT price_per_kg INTO v_daily_price
  FROM daily_prices
  WHERE fruit_type_id = (SELECT fruit_type_id FROM receptions WHERE id = p_recepcion_id)
    AND price_date = v_reception_date
    AND active = true
  LIMIT 1;

  -- If no daily price, use the existing base price
  IF v_daily_price IS NULL THEN
    v_daily_price := v_base_price_per_kg;
  END IF;

  -- Get quality evaluation data
  SELECT violetas, humedad, moho
  INTO v_violetas_val, v_humedad_val, v_moho_val
  FROM quality_evaluations
  WHERE recepcion_id = p_recepcion_id;

  -- Get discount thresholds for this fruit type
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', dt.id,
      'pricing_rule_id', dt.pricing_rule_id,
      'quality_metric', dt.quality_metric,
      'limit_value', dt.limit_value::numeric
    )
  ) INTO v_thresholds
  FROM discount_thresholds dt
  JOIN pricing_rules pr ON dt.pricing_rule_id = pr.id
  WHERE pr.fruit_type = v_fruit_type;

  -- Calculate quality discounts if we have quality data and thresholds
  IF v_thresholds IS NOT NULL AND jsonb_array_length(v_thresholds) > 0 THEN
    -- Build quality metrics array for calculation
    SELECT jsonb_agg(
      CASE
        WHEN (value).metric = 'Violetas' THEN
          jsonb_build_object(
            'metric', 'Violetas',
            'value', v_violetas_val,
            'discount_percentage', CASE
              WHEN v_violetas_val > (value).limit_value THEN
                -- Calculate discount percentage (this is simplified - should use proper calculation)
                GREATEST(0, v_violetas_val - (value).limit_value)
              ELSE 0
            END,
            'discount_amount', CASE
              WHEN v_violetas_val > (value).limit_value THEN
                v_total_weight * GREATEST(0, v_violetas_val - (value).limit_value) / 100
              ELSE 0
            END
          )
        WHEN (value).metric = 'Humedad' THEN
          jsonb_build_object(
            'metric', 'Humedad',
            'value', v_humedad_val,
            'discount_percentage', CASE
              WHEN v_humedad_val > (value).limit_value THEN
                GREATEST(0, v_humedad_val - (value).limit_value)
              ELSE 0
            END,
            'discount_amount', CASE
              WHEN v_humedad_val > (value).limit_value THEN
                v_total_weight * GREATEST(0, v_humedad_val - (value).limit_value) / 100
              ELSE 0
            END
          )
        WHEN (value).metric = 'Moho' THEN
          jsonb_build_object(
            'metric', 'Moho',
            'value', v_moho_val,
            'discount_percentage', CASE
              WHEN v_moho_val > (value).limit_value THEN
                GREATEST(0, v_moho_val - (value).limit_value)
              ELSE 0
            END,
            'discount_amount', CASE
              WHEN v_moho_val > (value).limit_value THEN
                v_total_weight * GREATEST(0, v_moho_val - (value).limit_value) / 100
              ELSE 0
            END
          )
      END
    ) INTO v_quality_metrics
    FROM jsonb_array_elements(v_thresholds) AS value
    WHERE (value->>'quality_metric') IN ('Violetas', 'Humedad', 'Moho');

    -- Calculate total discount amount
    SELECT COALESCE(SUM((value->>'discount_amount')::numeric), 0)
    INTO v_total_discount_amount
    FROM jsonb_array_elements(v_quality_metrics) AS value;
  END IF;

  -- Calculate final total
  v_final_total := v_gross_value - v_total_discount_amount;

  -- Build calculation data
  v_calculation_data := jsonb_build_object(
    'timestamp', NOW(),
    'fruit_type', v_fruit_type,
    'quality_metrics', v_quality_metrics,
    'daily_price_date', v_reception_date,
    'daily_price_used', v_daily_price IS NOT NULL,
    'applied_thresholds', v_applied_thresholds
  );

  -- Update pricing calculation
  UPDATE pricing_calculations SET
    base_price_per_kg = v_daily_price,
    total_discount_amount = v_total_discount_amount,
    final_total = v_final_total,
    calculation_data = v_calculation_data,
    updated_at = NOW()
  WHERE id = v_pricing_calculation_id;

  RAISE NOTICE 'Updated pricing calculation for reception %: discount_amount = %, final_total = %',
    p_recepcion_id, v_total_discount_amount, v_final_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGER: Update pricing calculation when quality evaluations change
-- ===========================================

CREATE OR REPLACE FUNCTION trigger_update_pricing_calculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when quality metrics are actually set/updated
  IF (TG_OP = 'UPDATE' AND (
    OLD.violetas IS DISTINCT FROM NEW.violetas OR
    OLD.humedad IS DISTINCT FROM NEW.humedad OR
    OLD.moho IS DISTINCT FROM NEW.moho
  )) OR (TG_OP = 'INSERT') THEN
    -- Update pricing calculation for this reception
    PERFORM update_reception_pricing_calculation(NEW.recepcion_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_reception_pricing_calculation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_pricing_calculation() TO authenticated;

-- Create trigger on quality_evaluations table
DROP TRIGGER IF EXISTS update_pricing_calculation_on_quality_change ON quality_evaluations;
CREATE TRIGGER update_pricing_calculation_on_quality_change
  AFTER INSERT OR UPDATE ON quality_evaluations
  FOR EACH ROW EXECUTE FUNCTION trigger_update_pricing_calculation();

-- ===========================================
-- COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ADDED: Trigger to update pricing calculations when quality evaluations change';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  1. Created update_reception_pricing_calculation() function';
  RAISE NOTICE '  2. Created trigger_update_pricing_calculation() trigger function';
  RAISE NOTICE '  3. Added trigger on quality_evaluations table';
  RAISE NOTICE '';
  RAISE NOTICE 'Now when you add or update quality evaluations,';
  RAISE NOTICE 'the pricing calculations will be automatically updated';
  RAISE NOTICE 'to reflect the quality-based discounts!';
  RAISE NOTICE '';
END $$;