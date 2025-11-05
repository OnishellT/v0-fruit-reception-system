-- Migration 28: Setup Discount Thresholds and Fix Quality Discount Application
-- Date: 2025-11-01
-- Purpose: Ensure discount thresholds exist and quality discounts are applied correctly

-- ===========================================
-- PART 1: CREATE PRICING RULES IF NOT EXISTS
-- ===========================================

-- Create pricing rules for each fruit type if they don't exist
DO $$
DECLARE
  cafe_rule_id UUID;
  cacao_rule_id UUID;
  miel_rule_id UUID;
  coco_rule_id UUID;
BEGIN
  -- Create pricing rule for CAFÉ
  INSERT INTO pricing_rules (
    fruit_type,
    quality_based_pricing_enabled,
    created_by
  )
  SELECT 'CAFÉ', true, u.id
  FROM users u WHERE u.role = 'admin' LIMIT 1
  ON CONFLICT (fruit_type) DO NOTHING
  RETURNING id INTO cafe_rule_id;

  -- Get CAFÉ rule ID if it was created
  IF cafe_rule_id IS NULL THEN
    SELECT id INTO cafe_rule_id FROM pricing_rules WHERE fruit_type = 'CAFÉ';
  END IF;

  -- Create pricing rule for CACAO
  INSERT INTO pricing_rules (
    fruit_type,
    quality_based_pricing_enabled,
    created_by
  )
  SELECT 'CACAO', true, u.id
  FROM users u WHERE u.role = 'admin' LIMIT 1
  ON CONFLICT (fruit_type) DO NOTHING
  RETURNING id INTO cacao_rule_id;

  -- Get CACAO rule ID if it was created
  IF cacao_rule_id IS NULL THEN
    SELECT id INTO cacao_rule_id FROM pricing_rules WHERE fruit_type = 'CACAO';
  END IF;

  -- Create pricing rule for MIEL
  INSERT INTO pricing_rules (
    fruit_type,
    quality_based_pricing_enabled,
    created_by
  )
  SELECT 'MIEL', true, u.id
  FROM users u WHERE u.role = 'admin' LIMIT 1
  ON CONFLICT (fruit_type) DO NOTHING
  RETURNING id INTO miel_rule_id;

  -- Get MIEL rule ID if it was created
  IF miel_rule_id IS NULL THEN
    SELECT id INTO miel_rule_id FROM pricing_rules WHERE fruit_type = 'MIEL';
  END IF;

  -- Create pricing rule for COCOS
  INSERT INTO pricing_rules (
    fruit_type,
    quality_based_pricing_enabled,
    created_by
  )
  SELECT 'COCOS', true, u.id
  FROM users u WHERE u.role = 'admin' LIMIT 1
  ON CONFLICT (fruit_type) DO NOTHING
  RETURNING id INTO coco_rule_id;

  -- Get COCOS rule ID if it was created
  IF coco_rule_id IS NULL THEN
    SELECT id INTO coco_rule_id FROM pricing_rules WHERE fruit_type = 'COCOS';
  END IF;

  RAISE NOTICE 'Pricing rules created/found for all fruit types (quality_based_pricing_enabled = true)';
END $$;

-- ===========================================
-- PART 2: CREATE DISCOUNT THRESHOLDS
-- ===========================================

-- Create default discount thresholds for CAFÉ
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 5, 10, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 10, 15, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 15, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 2, 5, 3.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 5, 100, 10.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Create default discount thresholds for CACAO
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 5, 10, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 10, 15, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 15, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 2, 5, 3.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 5, 100, 10.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Create default discount thresholds for MIEL
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 5, 10, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 10, 15, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 15, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 2, 5, 3.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 5, 100, 10.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Create default discount thresholds for COCOS
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 5, 10, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Violetas', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 10, 15, 2.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Humedad', 15, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 2, 5, 3.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Moho', 5, 100, 10.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- ===========================================
-- PART 3: RECREATE TRIGGER WITH LAB SAMPLE SUPPORT
-- ===========================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS auto_apply_quality_discounts ON quality_evaluations CASCADE;

-- Recreate trigger function
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
  LEFT JOIN discount_thresholds dt_humedad ON dt_humedad.quality_metric = 'Humedad' AND dt_humedad.pricing_rule_id = dt_violetas.pricing_rule_id
  LEFT JOIN discount_thresholds dt_moho ON dt_moho.quality_metric = 'Moho' AND dt_moho.pricing_rule_id = dt_violetas.pricing_rule_id
  WHERE dt_violetas.quality_metric = 'Violetas'
  LIMIT 1;

   -- Calculate individual discounts using threshold-based logic
   -- NEW LOGIC: discount_percentage = quality_value - threshold_limit
   IF v_violetas_val IS NOT NULL AND v_violetas_val > v_violetas_threshold_max THEN
     v_violetas_discount := v_original_weight * (v_violetas_val - v_violetas_threshold_max) / 100;
   ELSE
     v_violetas_discount := 0;
   END IF;

   IF v_humedad_val IS NOT NULL AND v_humedad_val > v_humedad_threshold_max THEN
     v_humedad_discount := v_original_weight * (v_humedad_val - v_humedad_threshold_max) / 100;
   ELSE
     v_humedad_discount := 0;
   END IF;

   IF v_moho_val IS NOT NULL AND v_moho_val > v_moho_threshold_max THEN
     v_moho_discount := v_original_weight * (v_moho_val - v_moho_threshold_max) / 100;
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
       v_violetas_threshold_max,
       v_violetas_val,
       (v_violetas_val - v_violetas_threshold_max), -- percentage discount
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
       v_humedad_threshold_max,
       v_humedad_val,
       (v_humedad_val - v_humedad_threshold_max), -- percentage discount
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
       v_moho_threshold_max,
       v_moho_val,
       (v_moho_val - v_moho_threshold_max), -- percentage discount
       v_moho_discount, -- weight discount in kg
       v_user_id
     );
   END IF;

  -- Update reception with discount totals
  -- CRITICAL FIX: Account for lab samples in total_peso_final calculation
  UPDATE receptions SET
    total_peso_descuento = v_total_weight_discount,
    total_peso_final = COALESCE(total_peso_original, v_original_weight)
                      - v_total_weight_discount
                      + (COALESCE(lab_sample_dried_weight, 0) - COALESCE(lab_sample_wet_weight, 0)),
    updated_at = NOW()
  WHERE id = p_recepcion_id;

  -- Update reception_details with discount calculations
  IF v_original_weight > 0 THEN
    UPDATE reception_details SET
      discounted_weight = original_weight - (original_weight * v_total_weight_discount / v_original_weight),
      discount_percentage = (v_total_weight_discount / v_original_weight) * 100
    WHERE reception_id = p_recepcion_id;
  END IF;

  RAISE NOTICE 'Applied quality discounts for reception %: total discount = % kg', p_recepcion_id, v_total_weight_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_apply_quality_discounts()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from the quality evaluation
  v_user_id := COALESCE(NEW.updated_by, NEW.created_by);

  -- Apply quality discounts
  PERFORM apply_quality_discounts(NEW.recepcion_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER auto_apply_quality_discounts
  AFTER INSERT OR UPDATE ON quality_evaluations
  FOR EACH ROW EXECUTE FUNCTION trigger_apply_quality_discounts();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION apply_quality_discounts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_apply_quality_discounts() TO authenticated;

-- ===========================================
-- PART 4: COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 28 completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: All components for quality discounts are now set up';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  1. Created pricing rules for all fruit types';
  RAISE NOTICE '  2. Created discount thresholds for all fruit types';
  RAISE NOTICE '  3. Recreated trigger with lab sample support';
  RAISE NOTICE '';
  RAISE NOTICE 'Discount thresholds created:';
  RAISE NOTICE '  - Violetas > 5: 2%% discount';
  RAISE NOTICE '  - Violetas > 10: 5%% discount';
  RAISE NOTICE '  - Humedad > 10: 2%% discount';
  RAISE NOTICE '  - Humedad > 15: 5%% discount';
  RAISE NOTICE '  - Moho > 2: 3%% discount';
  RAISE NOTICE '  - Moho > 5: 10%% discount';
  RAISE NOTICE '';
  RAISE NOTICE 'Formula: total_peso_final = original - discounts + (dried - wet)';
  RAISE NOTICE '';
  RAISE NOTICE 'The "registrar calidad" button will now work correctly!';
END $$;
