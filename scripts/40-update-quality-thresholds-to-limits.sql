-- Migration: Update discount_thresholds table to use limit_value instead of min/max ranges
-- Date: 2025-11-02
-- Description: Changes the quality discount system from range-based thresholds to limit-based thresholds

-- Drop the dependent view first
DROP VIEW IF EXISTS quality_discount_calculations;

-- Add the new limit_value column
ALTER TABLE discount_thresholds ADD COLUMN limit_value DECIMAL(5, 2);

-- Update existing data: convert min_value to limit_value (taking the lower bound as the new limit)
UPDATE discount_thresholds SET limit_value = min_value WHERE min_value IS NOT NULL;

-- Make limit_value NOT NULL after data migration
ALTER TABLE discount_thresholds ALTER COLUMN limit_value SET NOT NULL;
ALTER TABLE discount_thresholds ADD CONSTRAINT valid_limit_value CHECK (limit_value >= 0 AND limit_value <= 100);

-- Drop the old columns and constraints
ALTER TABLE discount_thresholds DROP CONSTRAINT IF EXISTS valid_threshold_range;
ALTER TABLE discount_thresholds DROP COLUMN min_value;
ALTER TABLE discount_thresholds DROP COLUMN max_value;
ALTER TABLE discount_thresholds DROP COLUMN discount_percentage;

-- Update the index to use the new column
DROP INDEX IF EXISTS idx_discount_thresholds_value_range;
CREATE INDEX IF NOT EXISTS idx_discount_thresholds_limit ON discount_thresholds (pricing_rule_id, quality_metric, limit_value);

-- Recreate the view with new limit-based logic
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
  -- Calculate proportional discount for each metric (quality_value - limit_value)
  CASE
    WHEN qe.violetas IS NOT NULL AND dt_violetas.limit_value IS NOT NULL AND qe.violetas > dt_violetas.limit_value THEN
      (COALESCE(r.total_peso_original, 0) * (qe.violetas - dt_violetas.limit_value) / 100)
    ELSE 0
  END as violetas_weight_discount,
  CASE
    WHEN qe.humedad IS NOT NULL AND dt_humedad.limit_value IS NOT NULL AND qe.humedad > dt_humedad.limit_value THEN
      (COALESCE(r.total_peso_original, 0) * (qe.humedad - dt_humedad.limit_value) / 100)
    ELSE 0
  END as humedad_weight_discount,
  CASE
    WHEN qe.moho IS NOT NULL AND dt_moho.limit_value IS NOT NULL AND qe.moho > dt_moho.limit_value THEN
      (COALESCE(r.total_peso_original, 0) * (qe.moho - dt_moho.limit_value) / 100)
    ELSE 0
  END as moho_weight_discount,
  -- Get limit values
  dt_violetas.limit_value as violetas_limit,
  dt_humedad.limit_value as humedad_limit,
  dt_moho.limit_value as moho_limit
FROM quality_evaluations qe
JOIN receptions r ON qe.recepcion_id = r.id
JOIN fruit_types ft ON r.fruit_type_id = ft.id
LEFT JOIN discount_thresholds dt_violetas ON dt_violetas.pricing_rule_id = (
  SELECT id FROM pricing_rules WHERE fruit_type = ft.type
)
  AND dt_violetas.quality_metric = 'Violetas'
LEFT JOIN discount_thresholds dt_humedad ON dt_humedad.pricing_rule_id = (
  SELECT id FROM pricing_rules WHERE fruit_type = ft.type
)
  AND dt_humedad.quality_metric = 'Humedad'
LEFT JOIN discount_thresholds dt_moho ON dt_moho.pricing_rule_id = (
  SELECT id FROM pricing_rules WHERE fruit_type = ft.type
)
  AND dt_moho.quality_metric = 'Moho';

-- Update comments
COMMENT ON COLUMN discount_thresholds.limit_value IS 'Quality limit percentage - anything above this gets discounted proportionally';
COMMENT ON VIEW quality_discount_calculations IS 'View to calculate proportional weight discounts from quality evaluations';