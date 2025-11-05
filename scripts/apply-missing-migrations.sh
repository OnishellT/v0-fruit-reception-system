#!/bin/bash
# Apply Missing Migrations Script
# This script applies migrations 36 and 37 which are needed for lab sample updates to work

set -e

echo "🔧 Applying Missing Migrations for Lab Sample Updates"
echo "====================================================="
echo ""

# Check if DATABASE_URL or Supabase connection exists
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_POSTGRES_URL" ]; then
    echo "❌ ERROR: No database connection found"
    echo ""
    echo "Please set one of the following environment variables:"
    echo "  - DATABASE_URL (for direct PostgreSQL)"
    echo "  - SUPABASE_POSTGRES_URL (for Supabase)"
    echo ""
    echo "Or run this script with the connection string as an argument:"
    echo "  ./apply-missing-migrations.sh 'postgres://user:pass@host:port/db'"
    exit 1
fi

# Use provided URL or environment variable
DB_URL="${1:-$DATABASE_URL}"
DB_URL="${DB_URL:-$SUPABASE_POSTGRES_URL}"

echo "📍 Using database: $(echo $DB_URL | sed 's|://.*@|://***@|')"
echo ""

# Apply Migration 36
echo "📦 Applying Migration 36: Add lab sample trigger..."
echo ""
psql "$DB_URL" <<'EOF'
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
EOF

echo ""
echo "✅ Migration 36 applied successfully!"
echo ""

# Apply Migration 37
echo "📦 Applying Migration 37: Fix total discount calculation..."
echo ""
psql "$DB_URL" <<'EOF'
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
  v_total_discount DECIMAL(10,2) := 0;
  v_original_weight DECIMAL(10,2) := 0;
  v_lab_wet DECIMAL(10,2) := 0;
  v_lab_dried DECIMAL(10,2) := 0;
  v_lab_adjustment DECIMAL(10,2) := 0;
  v_final_weight DECIMAL(10,2) := 0;
  v_discount_count INTEGER := 0;
  v_result JSON;
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
  SELECT COALESCE(SUM(peso_descuento), 0), COUNT(*)
  INTO v_total_discount, v_discount_count
  FROM desglose_descuentos
  WHERE recepcion_id = p_recepcion_id;

  -- Calculate lab adjustment (dried - wet)
  v_lab_adjustment := v_lab_dried - v_lab_wet;

  -- Calculate final weight: Original - Discount + Lab Adjustment
  v_final_weight := v_original_weight - v_total_discount + v_lab_adjustment;

  -- Build result JSON
  v_result := json_build_object(
    'reception_id', p_recepcion_id,
    'original_weight', v_original_weight,
    'total_discount', v_total_discount,
    'lab_wet_weight', v_lab_wet,
    'lab_dried_weight', v_lab_dried,
    'lab_adjustment', v_lab_adjustment,
    'final_weight', v_final_weight,
    'discount_records_count', v_discount_count,
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION manual_recalculate_discounts(UUID) TO authenticated;

-- ===========================================
-- PART 4: CREATE DEBUG VIEW
-- ===========================================

CREATE OR REPLACE VIEW reception_totals_with_discounts AS
SELECT
  r.id,
  r.total_peso_original,
  r.total_peso_descuento,
  r.total_peso_final,
  r.lab_sample_wet_weight,
  r.lab_sample_dried_weight,
  -- Calculate from breakdown
  COALESCE(SUM(dd.peso_descuento), 0) AS calculated_total_discount,
  COALESCE(SUM(dd.peso_descuento), 0) +
    COALESCE(r.lab_sample_wet_weight, 0) -
    COALESCE(r.lab_sample_dried_weight, 0) AS calculated_final_weight,
  -- Check for mismatches
  CASE
    WHEN ABS(COALESCE(r.total_peso_descuento, 0) - COALESCE(SUM(dd.peso_descuento), 0)) > 0.01
    THEN 'MISMATCH'
    ELSE 'MATCH'
  END AS discount_status,
  CASE
    WHEN ABS(COALESCE(r.total_peso_final, 0) - (
      COALESCE(r.total_peso_original, 0) -
      COALESCE(SUM(dd.peso_descuento), 0) +
      COALESCE(r.lab_sample_dried_weight, 0) -
      COALESCE(r.lab_sample_wet_weight, 0)
    )) > 0.01
    THEN 'MISMATCH'
    ELSE 'MATCH'
  END AS final_weight_status
FROM receptions r
LEFT JOIN desglose_descuentos dd ON r.id = dd.recepcion_id
GROUP BY r.id, r.total_peso_original, r.total_peso_descuento, r.total_peso_final,
         r.lab_sample_wet_weight, r.lab_sample_dried_weight;

-- Grant view access
GRANT SELECT ON reception_totals_with_discounts TO authenticated;

-- ===========================================
-- PART 5: COMPLETION MESSAGE
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
  RAISE NOTICE '  2. Created manual_recalculate_discounts() function';
  RAISE NOTICE '  3. Created reception_totals_with_discounts view';
  RAISE NOTICE '  4. Updated trigger to always recalculate totals';
  RAISE NOTICE '';
  RAISE NOTICE 'Now:';
  RAISE NOTICE '  - Lab sample updates will automatically update totals';
  RAISE NOTICE '  - Total discounts will match breakdown';
  RAISE NOTICE '  - Final weights will be calculated correctly';
  RAISE NOTICE '';
  RAISE NOTICE 'Use these functions:';
  RAISE NOTICE '  - recalculate_reception_totals(UUID) - Auto recalculation';
  RAISE NOTICE '  - manual_recalculate_discounts(UUID) - Manual check/debug';
  RAISE NOTICE '  - reception_totals_with_discounts - View all totals';
  RAISE NOTICE '';
END $$;
EOF

echo ""
echo "✅ Migration 37 applied successfully!"
echo ""

# Verify triggers
echo "🔍 Verifying triggers..."
echo ""
psql "$DB_URL" -c "SELECT tgname AS trigger_name, tgrelid::regclass AS table_name FROM pg_trigger WHERE tgname LIKE '%auto_apply_quality_discounts%';"

echo ""
echo "✅ All migrations applied successfully!"
echo ""
echo "====================================================="
echo "🎉 FIXED: Lab Sample Updates Now Work Automatically!"
echo "====================================================="
echo ""
echo "What you can do now:"
echo "  1. Update a lab sample with quality results"
echo "  2. Discounts will appear IMMEDIATELY in the reception"
echo "  3. No need to click 'Registrar Calidad' button!"
echo ""
echo "Test it:"
echo "  1. Go to a reception details page"
echo "  2. Find the lab sample section"
echo "  3. Update the sample with quality metrics"
echo "  4. See the discounts appear instantly!"
echo ""
