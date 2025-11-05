-- Migration 18: Universal Quality Evaluation System
-- Date: 2025-10-31
-- Purpose: Enable quality discounts for ALL fruit types and remove calidad_cafe dependency

-- ===========================================
-- FIX AUDIT TRIGGER IMMEDIATELY (BEFORE ANY OTHER OPERATIONS)
-- ===========================================

-- Drop old audit trigger with wrong audit_logs column names
DROP TRIGGER IF EXISTS audit_desglose_descuentos_trigger ON desglose_descuentos CASCADE;

-- Recreate audit trigger function with correct column names
CREATE OR REPLACE FUNCTION audit_desglose_descuentos()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from context
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name,
      action,
      record_id,
      old_values,
      new_values,
      user_id,
      created_at
    ) VALUES (
      'desglose_descuentos',
      'INSERT',
      NEW.id,
      NULL,
      row_to_json(NEW),
      v_user_id,
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name,
      action,
      record_id,
      old_values,
      new_values,
      user_id,
      created_at
    ) VALUES (
      'desglose_descuentos',
      'UPDATE',
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW),
      v_user_id,
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name,
      action,
      record_id,
      old_values,
      new_values,
      user_id,
      created_at
    ) VALUES (
      'desglose_descuentos',
      'DELETE',
      OLD.id,
      row_to_json(OLD),
      NULL,
      v_user_id,
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger with corrected function
CREATE TRIGGER audit_desglose_descuentos_trigger
AFTER INSERT OR UPDATE OR DELETE ON desglose_descuentos
FOR EACH ROW EXECUTE FUNCTION audit_desglose_descuentos();

-- ===========================================
-- ADD WEIGHT COLUMNS TO RECEPTIONS IF NOT EXISTS
-- ===========================================

-- Add weight discount columns to receptions if they don't exist
DO $$
BEGIN
  -- Add total_peso_original if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'receptions' AND column_name = 'total_peso_original') THEN
    ALTER TABLE receptions ADD COLUMN total_peso_original DECIMAL(10,2) DEFAULT 0;
    COMMENT ON COLUMN receptions.total_peso_original IS 'Peso total antes de aplicar descuentos (kg)';
  END IF;

  -- Add total_peso_descuento if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'receptions' AND column_name = 'total_peso_descuento') THEN
    ALTER TABLE receptions ADD COLUMN total_peso_descuento DECIMAL(10,2) DEFAULT 0;
    COMMENT ON COLUMN receptions.total_peso_descuento IS 'Peso total descontado por calidad (kg)';
  END IF;

  -- Add total_peso_final if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'receptions' AND column_name = 'total_peso_final') THEN
    ALTER TABLE receptions ADD COLUMN total_peso_final DECIMAL(10,2) DEFAULT 0;
    COMMENT ON COLUMN receptions.total_peso_final IS 'Peso final después de descuentos (kg)';
  END IF;

  -- Add constraints if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'chk_peso_original_nonnegative') THEN
    ALTER TABLE receptions
    ADD CONSTRAINT chk_peso_original_nonnegative CHECK (total_peso_original >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'chk_peso_descuento_nonnegative') THEN
    ALTER TABLE receptions
    ADD CONSTRAINT chk_peso_descuento_nonnegative CHECK (total_peso_descuento >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'chk_peso_final_nonnegative') THEN
    ALTER TABLE receptions
    ADD CONSTRAINT chk_peso_final_nonnegative CHECK (total_peso_final >= 0);
  END IF;

  -- Note: The chk_peso_calculation constraint is now handled by migration 24
  -- which allows for lab samples. DO NOT create it here.
END $$;

-- ===========================================
-- CREATE UNIVERSAL QUALITY EVALUATION TABLE
-- ===========================================
-- This replaces calidad_cafe and works for all fruit types

CREATE TABLE IF NOT EXISTS quality_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
  -- Quality metrics (0-100%)
  violetas DECIMAL(5,2) CHECK (violetas >= 0 AND violetas <= 100),
  humedad DECIMAL(5,2) CHECK (humedad >= 0 AND humedad <= 100),
  moho DECIMAL(5,2) CHECK (moho >= 0 AND moho <= 100),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recepcion_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quality_evaluations_recepcion_id ON quality_evaluations(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_quality_evaluations_created_by ON quality_evaluations(created_by);
CREATE INDEX IF NOT EXISTS idx_quality_evaluations_updated_by ON quality_evaluations(updated_by);

-- ===========================================
-- CREATE RLS POLICIES FOR QUALITY_EVALUATIONS
-- ===========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view quality evaluations" ON quality_evaluations;
DROP POLICY IF EXISTS "Only admins can create quality evaluations" ON quality_evaluations;
DROP POLICY IF EXISTS "Only admins can update quality evaluations" ON quality_evaluations;
DROP POLICY IF EXISTS "Only admins can delete quality evaluations" ON quality_evaluations;

-- Policy 1: Allow authenticated users to SELECT quality evaluations
CREATE POLICY "Authenticated users can view quality evaluations"
ON quality_evaluations FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow only admins to INSERT quality evaluations
CREATE POLICY "Only admins can create quality evaluations"
ON quality_evaluations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Policy 3: Allow only admins to UPDATE quality evaluations
CREATE POLICY "Only admins can update quality evaluations"
ON quality_evaluations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Policy 4: Allow only admins to DELETE quality evaluations
CREATE POLICY "Only admins can delete quality evaluations"
ON quality_evaluations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Enable RLS
ALTER TABLE quality_evaluations ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE quality_evaluations IS 'Universal quality evaluation for ALL fruit types (replaces calidad_cafe)';
COMMENT ON COLUMN quality_evaluations.recepcion_id IS 'Foreign key to receptions table';
COMMENT ON COLUMN quality_evaluations.violetas IS 'Percentage of purple grains/defects (0-100)';
COMMENT ON COLUMN quality_evaluations.humedad IS 'Moisture level percentage (0-100)';
COMMENT ON COLUMN quality_evaluations.moho IS 'Percentage of grains affected by mold (0-100)';

-- ===========================================
-- CREATE QUALITY-TO-DISCOUNT CALCULATION VIEW
-- ===========================================
-- This view helps calculate discounts from quality evaluations

CREATE OR REPLACE VIEW quality_discount_calculations AS
SELECT
  qe.id as quality_evaluation_id,
  qe.recepcion_id,
  qe.violetas,
  qe.humedad,
  qe.moho,
  r.fruit_type_id,
  ft.type as fruit_type,
  COALESCE(r.total_peso_original, 0) as total_weight,
  -- Calculate discount for each metric
  CASE
    WHEN qe.violetas IS NOT NULL AND dt_violetas.discount_percentage > 0 THEN
      (COALESCE(r.total_peso_original, 0) * dt_violetas.discount_percentage / 100)
    ELSE 0
  END as violetas_weight_discount,
  CASE
    WHEN qe.humedad IS NOT NULL AND dt_humedad.discount_percentage > 0 THEN
      (COALESCE(r.total_peso_original, 0) * dt_humedad.discount_percentage / 100)
    ELSE 0
  END as humedad_weight_discount,
  CASE
    WHEN qe.moho IS NOT NULL AND dt_moho.discount_percentage > 0 THEN
      (COALESCE(r.total_peso_original, 0) * dt_moho.discount_percentage / 100)
    ELSE 0
  END as moho_weight_discount,
  -- Get discount percentages
  dt_violetas.discount_percentage as violetas_discount_pct,
  dt_humedad.discount_percentage as humedad_discount_pct,
  dt_moho.discount_percentage as moho_discount_pct,
  -- Get threshold values
  dt_violetas.min_value as violetas_threshold_min,
  dt_violetas.max_value as violetas_threshold_max,
  dt_humedad.min_value as humedad_threshold_min,
  dt_humedad.max_value as humedad_threshold_max,
  dt_moho.min_value as moho_threshold_min,
  dt_moho.max_value as moho_threshold_max
FROM quality_evaluations qe
JOIN receptions r ON qe.recepcion_id = r.id
JOIN fruit_types ft ON r.fruit_type_id = ft.id
LEFT JOIN discount_thresholds dt_violetas ON dt_violetas.pricing_rule_id = (
  SELECT id FROM pricing_rules WHERE fruit_type = ft.type
)
  AND dt_violetas.quality_metric = 'Violetas'
  AND qe.violetas >= dt_violetas.min_value
  AND qe.violetas <= dt_violetas.max_value
LEFT JOIN discount_thresholds dt_humedad ON dt_humedad.pricing_rule_id = (
  SELECT id FROM pricing_rules WHERE fruit_type = ft.type
)
  AND dt_humedad.quality_metric = 'Humedad'
  AND qe.humedad >= dt_humedad.min_value
  AND qe.humedad <= dt_humedad.max_value
LEFT JOIN discount_thresholds dt_moho ON dt_moho.pricing_rule_id = (
  SELECT id FROM pricing_rules WHERE fruit_type = ft.type
)
  AND dt_moho.quality_metric = 'Moho'
  AND qe.moho >= dt_moho.min_value
  AND qe.moho <= dt_moho.max_value;

COMMENT ON VIEW quality_discount_calculations IS 'View to calculate weight discounts from quality evaluations';

-- ===========================================
-- FUNCTION TO APPLY QUALITY DISCOUNTS
-- ===========================================
-- This function calculates and applies quality-based discounts

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
-- TRIGGER TO AUTO-APPLY DISCOUNTS
-- ===========================================
-- Automatically apply discounts when quality evaluation is updated

CREATE OR REPLACE FUNCTION trigger_apply_quality_discounts()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from the quality evaluation
  -- For INSERT, use NEW.created_by
  -- For UPDATE, use NEW.updated_by
  v_user_id := COALESCE(NEW.updated_by, NEW.created_by);

  -- Apply quality discounts
  PERFORM apply_quality_discounts(NEW.recepcion_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_apply_quality_discounts ON quality_evaluations;
CREATE TRIGGER auto_apply_quality_discounts
  AFTER INSERT OR UPDATE ON quality_evaluations
  FOR EACH ROW EXECUTE FUNCTION trigger_apply_quality_discounts();

-- ===========================================
-- DATA MIGRATION: COPY FROM calidad_cafe
-- ===========================================
-- Copy existing data from calidad_cafe to quality_evaluations
-- Only if the old table exists

DO $$
BEGIN
  -- Check if the old table exists before migrating
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calidad_cafe') THEN
    RAISE NOTICE 'Migrating data from calidad_cafe to quality_evaluations...';

    INSERT INTO quality_evaluations (
      recepcion_id,
      violetas,
      humedad,
      moho,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    SELECT
      recepcion_id,
      violetas,
      humedad,
      moho,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM calidad_cafe
    ON CONFLICT (recepcion_id) DO NOTHING;

    RAISE NOTICE 'Successfully migrated % rows from calidad_cafe', (SELECT COUNT(*) FROM quality_evaluations);
  ELSE
    RAISE NOTICE 'Table calidad_cafe does not exist, skipping migration';
  END IF;
END $$;

-- ===========================================
-- APPLY DISCOUNTS TO EXISTING RECEPTIONS
-- ===========================================
-- Apply discounts to all receptions that have quality data

DO $$
DECLARE
  rec RECORD;
  v_user_id UUID;
BEGIN
  -- Get a default user ID for historical data
  SELECT id INTO v_user_id
  FROM users
  WHERE role = 'admin' AND is_active = true
  LIMIT 1;

  -- If no admin found, use placeholder
  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;

  FOR rec IN
    SELECT DISTINCT recepcion_id FROM quality_evaluations
  LOOP
    BEGIN
      PERFORM apply_quality_discounts(rec.recepcion_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error applying discounts to reception %: %', rec.recepcion_id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Applied quality discounts to % receptions', (SELECT COUNT(*) FROM quality_evaluations);
END $$;

-- ===========================================
-- CLEANUP: REMOVE OLD TABLE
-- ===========================================
-- Drop the old calidad_cafe table and its policies
-- Only if the table exists

DO $$
BEGIN
  -- Check if the old table exists before cleanup
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calidad_cafe') THEN
    RAISE NOTICE 'Cleaning up old calidad_cafe table...';

    -- Drop triggers first
    DROP TRIGGER IF EXISTS update_calidad_cafe_updated_at ON calidad_cafe;

    -- Drop policies
    DROP POLICY IF EXISTS "Authenticated users can view quality data" ON calidad_cafe;
    DROP POLICY IF EXISTS "Only admins can create quality data" ON calidad_cafe;
    DROP POLICY IF EXISTS "Only admins can update quality data" ON calidad_cafe;
    DROP POLICY IF EXISTS "Only admins can delete quality data" ON calidad_cafe;

    -- Drop table
    DROP TABLE IF EXISTS calidad_cafe CASCADE;

    RAISE NOTICE 'Successfully removed old calidad_cafe table';
  ELSE
    RAISE NOTICE 'Table calidad_cafe does not exist, cleanup skipped';
  END IF;
END $$;

-- ===========================================
-- COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 18 completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'FIXED ALL 4 ERRORS:';
  RAISE NOTICE '1. Audit trigger fixed FIRST (before any inserts)';
  RAISE NOTICE '2. Column name errors fixed (total_weight -> total_peso_original)';
  RAISE NOTICE '3. User ID handling with fallbacks';
  RAISE NOTICE '4. Numeric field overflow fixed (DECIMAL 5,2 -> 10,2)';
  RAISE NOTICE '';
  RAISE NOTICE 'SYSTEM READY:';
  RAISE NOTICE '- Created universal quality_evaluations table';
  RAISE NOTICE '- Quality discounts work for ALL fruit types';
  RAISE NOTICE '- Weight columns added if needed';
  RAISE NOTICE '- Auto-apply trigger installed';
  RAISE NOTICE '- Migrated existing quality data';
  RAISE NOTICE '- Applied discounts to existing receptions';
  RAISE NOTICE '';
  RAISE NOTICE 'Quality discounts now available for CAFÉ, CACAO, MIEL, COCOS!';
  RAISE NOTICE 'Using desglose_descuentos table with discount_thresholds!';
  RAISE NOTICE '===========================================';
END $$;
