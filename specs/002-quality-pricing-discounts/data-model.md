# Data Model: Dynamic Quality-Based Pricing System

**Date**: 2025-10-31
**Feature**: Dynamic Quality-Based Pricing System
**Status**: Design Complete

## Database Schema

### New Tables

#### 1. pricing_rules

Stores configuration for quality-based pricing per fruit type.

```sql
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_type VARCHAR NOT NULL, -- 'Café', 'Cacao', 'Miel', 'Cocos'
  quality_based_pricing_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT unique_fruit_type UNIQUE (fruit_type)
);

-- Index for fast fruit type lookups
CREATE INDEX idx_pricing_rules_fruit_type ON pricing_rules(fruit_type);
```

**Purpose**: One record per fruit type, storing whether quality-based pricing is enabled.

**Key Fields**:
- `fruit_type`: The type of fruit (Café, Cacao, Miel, Cocos)
- `quality_based_pricing_enabled`: Whether to apply quality discounts for this fruit type

#### 2. discount_thresholds

Stores threshold ranges and discount percentages for each quality metric.

```sql
CREATE TABLE discount_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  quality_metric VARCHAR NOT NULL, -- 'Violetas', 'Humedad', 'Moho'
  min_value DECIMAL NOT NULL,
  max_value DECIMAL NOT NULL,
  discount_percentage DECIMAL NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT valid_range CHECK (min_value <= max_value)
);

-- Indexes for fast threshold lookups
CREATE INDEX idx_discount_thresholds_rule_metric ON discount_thresholds(pricing_rule_id, quality_metric);
CREATE INDEX idx_discount_thresholds_value_range ON discount_thresholds USING btree (min_value, max_value);
```

**Purpose**: Multiple thresholds per fruit type per quality metric, allowing compound discounts.

**Key Fields**:
- `pricing_rule_id`: Links to pricing_rules table
- `quality_metric`: The quality parameter (Violetas, Humedad, Moho)
- `min_value` / `max_value`: The range of quality values this threshold applies to
- `discount_percentage`: The percentage discount to apply (0-100)

**Example**:
```
Violetas: 0-5% → 0% discount
Violetas: 5-15% → 5% discount
Violetas: 15-30% → 10% discount
```

#### 3. pricing_calculations

Stores immutable pricing calculations for each reception.

```sql
CREATE TABLE pricing_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id UUID NOT NULL,
  base_price_per_kg DECIMAL NOT NULL,
  total_weight DECIMAL NOT NULL,
  gross_value DECIMAL NOT NULL,
  total_discount_amount DECIMAL DEFAULT 0,
  final_total DECIMAL NOT NULL,
  calculation_data JSONB NOT NULL, -- Detailed breakdown of all discounts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT positive_final_total CHECK (final_total >= 0)
);

-- Index for reception lookups
CREATE INDEX idx_pricing_calculations_reception ON pricing_calculations(reception_id);
```

**Purpose**: Immutable snapshot of pricing calculation at time of reception save.

**Key Fields**:
- `reception_id`: Links to the reception
- `base_price_per_kg`: Base price used for calculation
- `total_weight`: Weight of the reception
- `gross_value`: Base price × weight (before discounts)
- `total_discount_amount`: Sum of all discounts applied
- `final_total`: Gross value - total discounts
- `calculation_data`: JSON with detailed breakdown:
  ```json
  {
    "quality_metrics": [
      {
        "metric": "Violetas",
        "value": 12.5,
        "discount_percentage": 5,
        "discount_amount": 25.00
      }
    ],
    "total_discounts": 45.00,
    "timestamp": "2025-10-31T..."
  }
  ```

### Modified Tables

#### receptions

Add foreign key to pricing_calculations.

```sql
ALTER TABLE receptions
ADD COLUMN pricing_calculation_id UUID REFERENCES pricing_calculations(id);

-- Index for fast pricing data retrieval
CREATE INDEX idx_receptions_pricing_calculation ON receptions(pricing_calculation_id);
```

**Purpose**: Link each reception to its immutable pricing calculation.

## Row Level Security (RLS) Policies

### pricing_rules

```sql
-- Administrators can view all pricing rules
CREATE POLICY "pricing_rules_select_admin"
ON pricing_rules FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Administrators can insert pricing rules
CREATE POLICY "pricing_rules_insert_admin"
ON pricing_rules FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Administrators can update pricing rules
CREATE POLICY "pricing_rules_update_admin"
ON pricing_rules FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Administrators can delete pricing rules (soft delete via updated_at)
CREATE POLICY "pricing_rules_delete_admin"
ON pricing_rules FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

### discount_thresholds

```sql
-- All authenticated users can view thresholds
CREATE POLICY "discount_thresholds_select_all"
ON discount_thresholds FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify thresholds
CREATE POLICY "discount_thresholds_modify_admin"
ON discount_thresholds FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### pricing_calculations

```sql
-- All authenticated users can view pricing calculations
CREATE POLICY "pricing_calculations_select_all"
ON pricing_calculations FOR SELECT
TO authenticated
USING (true);

-- Only admins or service role can insert (via server action)
CREATE POLICY "pricing_calculations_insert_service"
ON pricing_calculations FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- No updates allowed (immutable)
CREATE POLICY "pricing_calculations_no_update"
ON pricing_calculations FOR UPDATE
TO authenticated
USING (false);

-- No deletes allowed (immutable)
CREATE POLICY "pricing_calculations_no_delete"
ON pricing_calculations FOR DELETE
TO authenticated
USING (false);
```

## TypeScript Types

### Zod Schemas

```typescript
import { z } from 'zod';

export const DiscountThresholdSchema = z.object({
  id: z.string().uuid().optional(),
  pricingRuleId: z.string().uuid(),
  qualityMetric: z.enum(['Violetas', 'Humedad', 'Moho']),
  minValue: z.number().min(0),
  maxValue: z.number().min(0),
  discountPercentage: z.number().min(0).max(100),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).refine((data) => data.minValue <= data.maxValue, {
  message: "minValue must be less than or equal to maxValue",
  path: ["minValue"]
});

export const PricingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  fruitType: z.enum(['Café', 'Cacao', 'Miel', 'Cocos']),
  qualityBasedPricingEnabled: z.boolean(),
  thresholds: z.array(DiscountThresholdSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const PricingCalculationSchema = z.object({
  id: z.string().uuid().optional(),
  receptionId: z.string().uuid(),
  basePricePerKg: z.number().min(0),
  totalWeight: z.number().min(0),
  grossValue: z.number().min(0),
  totalDiscountAmount: z.number().min(0),
  finalTotal: z.number().min(0),
  calculationData: z.object({
    qualityMetrics: z.array(z.object({
      metric: z.string(),
      value: z.number(),
      discountPercentage: z.number(),
      discountAmount: z.number()
    })),
    totalDiscounts: z.number(),
    timestamp: z.string()
  }),
  createdAt: z.date().optional(),
  createdBy: z.string().uuid().optional()
});

export type DiscountThreshold = z.infer<typeof DiscountThresholdSchema>;
export type PricingRule = z.infer<typeof PricingRuleSchema>;
export type PricingCalculation = z.infer<typeof PricingCalculationSchema>;
```

## Data Relationships

```
┌─────────────────┐
│   pricing_rules │
│                 │
│ fruit_type      │
│ enabled         │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐     ┌──────────────────────┐
│discount_threshol│     │  pricing_calculations│
│ ds              │     │                      │
│                 │     │ reception_id         │
│ pricing_rule_id │     │ base_price_per_kg    │
│ quality_metric  │     │ gross_value          │
│ min_value       │     │ total_discount       │
│ max_value       │     │ final_total          │
│ discount_%      │     │ calculation_data     │
└─────────────────┘     └──────────┬───────────┘
                                    │
                                    │ 1:1
                                    │
                            ┌───────▼────────┐
                            │   receptions   │
                            │                │
                            │ weight         │
                            │ fruit_type     │
                            │ quality_eval   │
                            │ pricing_calc_id│
                            └────────────────┘
```

## Pricing Calculation Algorithm

```typescript
interface QualityMetricValue {
  metric: string;
  value: number;
}

function calculatePricing(
  basePricePerKg: number,
  totalWeight: number,
  qualityMetrics: QualityMetricValue[],
  thresholds: DiscountThreshold[]
): PricingCalculation {
  const grossValue = basePricePerKg * totalWeight;
  const applicableDiscounts: DiscountDetail[] = [];

  // For each quality metric, find applicable thresholds
  for (const metric of qualityMetrics) {
    const metricThresholds = thresholds.filter(
      t => t.qualityMetric === metric.metric &&
           metric.value >= t.minValue &&
           metric.value <= t.maxValue
    );

    // Apply all matching thresholds
    for (const threshold of metricThresholds) {
      const discountAmount = grossValue * (threshold.discountPercentage / 100);
      applicableDiscounts.push({
        metric: metric.metric,
        value: metric.value,
        discountPercentage: threshold.discountPercentage,
        discountAmount
      });
    }
  }

  const totalDiscountAmount = applicableDiscounts.reduce(
    (sum, d) => sum + d.discountAmount, 0
  );

  return {
    basePricePerKg,
    totalWeight,
    grossValue,
    totalDiscountAmount,
    finalTotal: grossValue - totalDiscountAmount,
    calculationData: {
      qualityMetrics: applicableDiscounts,
      totalDiscounts: totalDiscountAmount,
      timestamp: new Date().toISOString()
    }
  };
}
```

## Migration Strategy

### Migration 1: Create Tables

```sql
-- Run in order:
-- 1. Create pricing_rules
-- 2. Create discount_thresholds
-- 3. Create pricing_calculations
-- 4. Add FK to receptions
-- 5. Create indexes
-- 6. Setup RLS policies
```

### Migration 2: Seed Initial Data

```sql
-- Insert default pricing rules for all fruit types (disabled by default)
INSERT INTO pricing_rules (fruit_type, quality_based_pricing_enabled)
VALUES
  ('Café', false),
  ('Cacao', false),
  ('Miel', false),
  ('Cocos', false);
```

## Data Integrity Constraints

1. **Foreign Key Constraints**: Ensure referential integrity
2. **Check Constraints**: Prevent invalid values (e.g., negative prices, percentages > 100)
3. **Unique Constraints**: One pricing rule per fruit type
4. **Range Validation**: minValue ≤ maxValue
5. **Immutability**: No UPDATE/DELETE on pricing_calculations

## Performance Optimization

### Indexes

1. `idx_pricing_rules_fruit_type` - Fast fruit type lookups
2. `idx_discount_thresholds_rule_metric` - Fast rule + metric filtering
3. `idx_discount_thresholds_value_range` - B-tree for range queries
4. `idx_pricing_calculations_reception` - Fast reception → pricing lookup
5. `idx_receptions_pricing_calculation` - Fast pricing → reception reverse lookup

### Query Optimization

```sql
-- Efficient threshold lookup for a specific fruit type and metric:
SELECT * FROM discount_thresholds
WHERE pricing_rule_id = $1
  AND quality_metric = $2
  AND $value BETWEEN min_value AND max_value
ORDER BY min_value;
```

## Audit Trail

All pricing rules and thresholds include:
- `created_at`, `created_by`
- `updated_at`, `updated_by`

Pricing calculations are completely immutable:
- No UPDATE or DELETE allowed
- Full snapshot of calculation at time of save
- Links to user who created the calculation

---

**Status**: Data model complete - Ready for API contract design
**Next Document**: contracts/ (API endpoints definition)