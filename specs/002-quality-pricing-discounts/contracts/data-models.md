# Data Models: Dynamic Quality-Based Pricing System

## TypeScript Types

### Core Models

```typescript
// Pricing Rule Configuration
export interface PricingRule {
  id: string;
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  qualityBasedPricingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Discount Threshold Range
export interface DiscountThreshold {
  id: string;
  pricingRuleId: string;
  qualityMetric: 'Violetas' | 'Humedad' | 'Moho';
  minValue: number;
  maxValue: number;
  discountPercentage: number; // 0-100
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Immutable Pricing Calculation
export interface PricingCalculation {
  id: string;
  receptionId: string;
  basePricePerKg: number;
  totalWeight: number;
  grossValue: number;
  totalDiscountAmount: number;
  finalTotal: number;
  calculationData: CalculationData;
  createdAt: string;
  createdBy?: string;
}

// Detailed Calculation Data
export interface CalculationData {
  qualityMetrics: QualityMetricDiscount[];
  totalDiscounts: number;
  timestamp: string;
  fruitType: string;
  appliedThresholds: AppliedThreshold[];
}

// Individual Quality Metric Discount
export interface QualityMetricDiscount {
  metric: string;
  value: number;
  discountPercentage: number;
  discountAmount: number;
}

// Applied Threshold Reference
export interface AppliedThreshold {
  qualityMetric: string;
  minValue: number;
  maxValue: number;
  discountPercentage: number;
}

// Quality Metric Value (Input)
export interface QualityMetricValue {
  metric: 'Violetas' | 'Humedad' | 'Moho';
  value: number;
}
```

---

## Zod Validation Schemas

### Pricing Rules

```typescript
import { z } from 'zod';

export const DiscountThresholdSchema = z.object({
  id: z.string().uuid().optional(),
  pricingRuleId: z.string().uuid(),
  qualityMetric: z.enum(['Violetas', 'Humedad', 'Moho']),
  minValue: z.number().min(0),
  maxValue: z.number().min(0),
  discountPercentage: z.number().min(0).max(100),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional()
}).refine(
  (data) => data.minValue <= data.maxValue,
  {
    message: "minValue must be less than or equal to maxValue",
    path: ["minValue"]
  }
);

export const PricingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  fruitType: z.enum(['Café', 'Cacao', 'Miel', 'Cocos']),
  qualityBasedPricingEnabled: z.boolean(),
  thresholds: z.array(DiscountThresholdSchema),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional()
});

export const CreateDiscountThresholdSchema = z.object({
  pricingRuleId: z.string().uuid(),
  qualityMetric: z.enum(['Violetas', 'Humedad', 'Moho']),
  minValue: z.number().min(0),
  maxValue: z.number().min(0),
  discountPercentage: z.number().min(0).max(100)
}).refine(
  (data) => data.minValue <= data.maxValue,
  {
    message: "minValue must be less than or equal to maxValue",
    path: ["minValue"]
  }
);

export const UpdateDiscountThresholdSchema = z.object({
  id: z.string().uuid(),
  minValue: z.number().min(0),
  maxValue: z.number().min(0),
  discountPercentage: z.number().min(0).max(100)
}).refine(
  (data) => data.minValue <= data.maxValue,
  {
    message: "minValue must be less than or equal to maxValue",
    path: ["minValue"]
  }
);
```

### Pricing Calculations

```typescript
export const QualityMetricValueSchema = z.object({
  metric: z.enum(['Violetas', 'Humedad', 'Moho']),
  value: z.number()
});

export const CalculateReceptionPricingRequestSchema = z.object({
  fruitType: z.enum(['Café', 'Cacao', 'Miel', 'Cocos']),
  totalWeight: z.number().min(0.01),
  basePricePerKg: z.number().min(0),
  qualityEvaluation: z.array(QualityMetricValueSchema).min(1)
});

export const QualityMetricDiscountSchema = z.object({
  metric: z.string(),
  value: z.number(),
  discountPercentage: z.number(),
  discountAmount: z.number()
});

export const AppliedThresholdSchema = z.object({
  qualityMetric: z.string(),
  minValue: z.number(),
  maxValue: z.number(),
  discountPercentage: z.number()
});

export const CalculationDataSchema = z.object({
  qualityMetrics: z.array(QualityMetricDiscountSchema),
  totalDiscounts: z.number(),
  timestamp: z.string(),
  fruitType: z.string(),
  appliedThresholds: z.array(AppliedThresholdSchema)
});

export const PricingCalculationSchema = z.object({
  id: z.string().uuid(),
  receptionId: z.string().uuid(),
  basePricePerKg: z.number(),
  totalWeight: z.number(),
  grossValue: z.number(),
  totalDiscountAmount: z.number(),
  finalTotal: z.number(),
  calculationData: CalculationDataSchema,
  createdAt: z.string(),
  createdBy: z.string().uuid().optional()
});

export const PricingCalculationPreviewSchema = z.object({
  basePricePerKg: z.number(),
  totalWeight: z.number(),
  grossValue: z.number(),
  totalDiscountAmount: z.number(),
  finalTotal: z.number(),
  discountBreakdown: z.array(QualityMetricDiscountSchema),
  appliedThresholds: z.array(AppliedThresholdSchema)
});
```

---

## Database Types (Supabase)

### Generated Types

```typescript
// Database table types (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      pricing_rules: {
        Row: {
          id: string;
          fruit_type: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
          quality_based_pricing_enabled: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          fruit_type: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
          quality_based_pricing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          fruit_type?: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
          quality_based_pricing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      discount_thresholds: {
        Row: {
          id: string;
          pricing_rule_id: string;
          quality_metric: 'Violetas' | 'Humedad' | 'Moho';
          min_value: number;
          max_value: number;
          discount_percentage: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          pricing_rule_id: string;
          quality_metric: 'Violetas' | 'Humedad' | 'Moho';
          min_value: number;
          max_value: number;
          discount_percentage: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          pricing_rule_id?: string;
          quality_metric?: 'Violetas' | 'Humedad' | 'Moho';
          min_value?: number;
          max_value?: number;
          discount_percentage?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      pricing_calculations: {
        Row: {
          id: string;
          reception_id: string;
          base_price_per_kg: number;
          total_weight: number;
          gross_value: number;
          total_discount_amount: number;
          final_total: number;
          calculation_data: {
            quality_metrics: Array<{
              metric: string;
              value: number;
              discount_percentage: number;
              discount_amount: number;
            }>;
            total_discounts: number;
            timestamp: string;
            fruit_type: string;
            applied_thresholds: Array<{
              quality_metric: string;
              min_value: number;
              max_value: number;
              discount_percentage: number;
            }>;
          };
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          reception_id: string;
          base_price_per_kg: number;
          total_weight: number;
          gross_value: number;
          total_discount_amount?: number;
          final_total: number;
          calculation_data: {
            quality_metrics: Array<{
              metric: string;
              value: number;
              discount_percentage: number;
              discount_amount: number;
            }>;
            total_discounts: number;
            timestamp: string;
            fruit_type: string;
            applied_thresholds: Array<{
              quality_metric: string;
              min_value: number;
              max_value: number;
              discount_percentage: number;
            }>;
          };
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          // No updates allowed - immutable
        };
      };
    };
  };
}
```

---

## Utility Types

### Form Input Types

```typescript
// Form input types (for UI components)
export interface PricingRuleFormData {
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  qualityBasedPricingEnabled: boolean;
}

export interface ThresholdFormData {
  qualityMetric: 'Violetas' | 'Humedad' | 'Moho';
  minValue: string; // String for form input
  maxValue: string;
  discountPercentage: string;
}

export interface ReceptionPricingFormData {
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  totalWeight: string;
  basePricePerKg: string;
  qualityEvaluation: Array<{
    metric: 'Violetas' | 'Humedad' | 'Moho';
    value: string;
  }>;
}
```

### Response Types

```typescript
// API response wrapper types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Type Guards

```typescript
// Runtime type guards
export function isPricingRule(obj: unknown): obj is PricingRule {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'fruitType' in obj &&
    'qualityBasedPricingEnabled' in obj
  );
}

export function isDiscountThreshold(obj: unknown): obj is DiscountThreshold {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'qualityMetric' in obj &&
    'minValue' in obj &&
    'maxValue' in obj &&
    'discountPercentage' in obj
  );
}

export function isPricingCalculation(obj: unknown): obj is PricingCalculation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'receptionId' in obj &&
    'basePricePerKg' in obj &&
    'finalTotal' in obj
  );
}
```

---

## Constants

```typescript
// Enumerations and constants
export const FRUIT_TYPES = ['Café', 'Cacao', 'Miel', 'Cocos'] as const;
export const QUALITY_METRICS = ['Violetas', 'Humedad', 'Moho'] as const;

export const MIN_DISCOUNT_PERCENTAGE = 0;
export const MAX_DISCOUNT_PERCENTAGE = 100;

// Default thresholds (example)
export const DEFAULT_THRESHOLDS = {
  Violetas: [
    { minValue: 0, maxValue: 5, discountPercentage: 0 },
    { minValue: 5, maxValue: 15, discountPercentage: 5 },
    { minValue: 15, maxValue: 30, discountPercentage: 10 },
    { minValue: 30, maxValue: 100, discountPercentage: 20 }
  ],
  Humedad: [
    { minValue: 0, maxValue: 10, discountPercentage: 0 },
    { minValue: 10, maxValue: 20, discountPercentage: 3 },
    { minValue: 20, maxValue: 30, discountPercentage: 8 }
  ],
  Moho: [
    { minValue: 0, maxValue: 5, discountPercentage: 0 },
    { minValue: 5, maxValue: 15, discountPercentage: 10 },
    { minValue: 15, maxValue: 30, discountPercentage: 25 }
  ]
};
```

---

**Status**: Data models complete
**Usage**: Import types and schemas from this file in implementation