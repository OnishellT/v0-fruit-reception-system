-- Migration 35: Add Basura thresholds for lab sample quality discounts
-- Date: 2025-11-01
-- Purpose: Add discount thresholds for Basura quality metric (lab samples)

-- Insert Basura discount thresholds for CAFÉ
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Basura', 5, 10, 2.0, u.id
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
SELECT pr.id, 'Basura', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CAFÉ' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Insert Basura discount thresholds for CACAO
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Basura', 5, 10, 2.0, u.id
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
SELECT pr.id, 'Basura', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'CACAO' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Insert Basura discount thresholds for MIEL
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Basura', 5, 10, 2.0, u.id
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
SELECT pr.id, 'Basura', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'MIEL' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Insert Basura discount thresholds for COCOS
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT pr.id, 'Basura', 5, 10, 2.0, u.id
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
SELECT pr.id, 'Basura', 10, 100, 5.0, u.id
FROM pricing_rules pr, users u
WHERE pr.fruit_type = 'COCOS' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Migration 35 completed - Added Basura thresholds for all fruit types';
  RAISE NOTICE 'Thresholds added:';
  RAISE NOTICE '  - Basura > 5%%: 2%% discount';
  RAISE NOTICE '  - Basura > 10%%: 5%% discount';
END $$;
