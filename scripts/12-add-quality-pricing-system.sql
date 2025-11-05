-- Migration: Add Quality-Based Pricing System Tables
-- Date: 2025-10-31
-- Purpose: Create tables for dynamic quality-based pricing discounts

-- ===========================================
-- TABLE 1: Pricing Rules
-- ===========================================
-- Stores configuration for quality-based pricing per fruit type

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_type VARCHAR(50) NOT NULL CHECK (fruit_type IN ('CAFÉ', 'CACAO', 'MIEL', 'COCOS')),
  quality_based_pricing_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT unique_fruit_type_pricing_rule UNIQUE (fruit_type)
);

-- Index for fast fruit type lookups
CREATE INDEX IF NOT EXISTS idx_pricing_rules_fruit_type ON pricing_rules(fruit_type);

-- ===========================================
-- TABLE 2: Discount Thresholds
-- ===========================================
-- Stores threshold ranges and discount percentages for each quality metric

CREATE TABLE IF NOT EXISTS discount_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  quality_metric VARCHAR(50) NOT NULL CHECK (quality_metric IN ('Violetas', 'Humedad', 'Moho')),
  min_value DECIMAL(10, 2) NOT NULL CHECK (min_value >= 0),
  max_value DECIMAL(10, 2) NOT NULL CHECK (max_value >= 0),
  discount_percentage DECIMAL(5, 2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT valid_threshold_range CHECK (min_value <= max_value)
);

-- Indexes for fast threshold lookups
CREATE INDEX IF NOT EXISTS idx_discount_thresholds_pricing_rule ON discount_thresholds(pricing_rule_id);
CREATE INDEX IF NOT EXISTS idx_discount_thresholds_metric ON discount_thresholds(quality_metric);
CREATE INDEX IF NOT EXISTS idx_discount_thresholds_value_range ON discount_thresholds (pricing_rule_id, quality_metric, min_value, max_value);

-- ===========================================
-- TABLE 3: Pricing Calculations
-- ===========================================
-- Stores immutable pricing calculations for each reception

CREATE TABLE IF NOT EXISTS pricing_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id UUID NOT NULL UNIQUE,
  base_price_per_kg DECIMAL(10, 2) NOT NULL CHECK (base_price_per_kg >= 0),
  total_weight DECIMAL(10, 2) NOT NULL CHECK (total_weight >= 0),
  gross_value DECIMAL(10, 2) NOT NULL CHECK (gross_value >= 0),
  total_discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_discount_amount >= 0),
  final_total DECIMAL(10, 2) NOT NULL CHECK (final_total >= 0),
  calculation_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT positive_final_total CHECK (final_total >= 0)
);

-- Index for reception lookups
CREATE INDEX IF NOT EXISTS idx_pricing_calculations_reception ON pricing_calculations(reception_id);

-- Add comments for documentation
COMMENT ON TABLE pricing_rules IS 'Configuration for quality-based pricing per fruit type';
COMMENT ON COLUMN pricing_rules.fruit_type IS 'Type of fruit (CAFÉ, CACAO, MIEL, COCOS)';
COMMENT ON COLUMN pricing_rules.quality_based_pricing_enabled IS 'Whether quality-based pricing is enabled for this fruit type';

COMMENT ON TABLE discount_thresholds IS 'Discount thresholds and ranges for quality metrics';
COMMENT ON COLUMN discount_thresholds.pricing_rule_id IS 'Links to pricing_rules table';
COMMENT ON COLUMN discount_thresholds.quality_metric IS 'Quality parameter (Violetas, Humedad, Moho)';
COMMENT ON COLUMN discount_thresholds.min_value IS 'Minimum quality value for this threshold';
COMMENT ON COLUMN discount_thresholds.max_value IS 'Maximum quality value for this threshold';
COMMENT ON COLUMN discount_thresholds.discount_percentage IS 'Discount percentage to apply (0-100)';

COMMENT ON TABLE pricing_calculations IS 'Immutable pricing calculation snapshot per reception';
COMMENT ON COLUMN pricing_calculations.reception_id IS 'Links to receptions table';
COMMENT ON COLUMN pricing_calculations.base_price_per_kg IS 'Base price used for calculation';
COMMENT ON COLUMN pricing_calculations.total_weight IS 'Total weight of reception';
COMMENT ON COLUMN pricing_calculations.gross_value IS 'Base price × weight (before discounts)';
COMMENT ON COLUMN pricing_calculations.total_discount_amount IS 'Sum of all discounts applied';
COMMENT ON COLUMN pricing_calculations.final_total IS 'Gross value - total discounts';
COMMENT ON COLUMN pricing_calculations.calculation_data IS 'JSON breakdown of all discounts by quality metric';

-- ===========================================
-- ENABLE RLS
-- ===========================================
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_calculations ENABLE ROW LEVEL SECURITY;
