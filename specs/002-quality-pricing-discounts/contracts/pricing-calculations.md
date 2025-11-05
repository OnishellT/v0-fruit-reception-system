# Pricing Calculations API Contracts

## Endpoints

### 1. Calculate Reception Pricing

**Endpoint**: `server action: calculateReceptionPricing`

**Purpose**: Calculate pricing for a reception without saving (preview/validation)

**Request**:

```typescript
interface CalculateReceptionPricingRequest {
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  totalWeight: number;
  basePricePerKg: number;
  qualityEvaluation: QualityMetricValue[];
}

interface QualityMetricValue {
  metric: 'Violetas' | 'Humedad' | 'Moho';
  value: number;
}
```

**Response**:

```typescript
interface CalculateReceptionPricingResponse {
  canCalculate: boolean;
  pricingCalculation?: PricingCalculationPreview;
  errors?: string[];
}

interface PricingCalculationPreview {
  basePricePerKg: number;
  totalWeight: number;
  grossValue: number;
  totalDiscountAmount: number;
  finalTotal: number;
  discountBreakdown: DiscountBreakdownItem[];
  appliedThresholds: AppliedThreshold[];
}

interface DiscountBreakdownItem {
  qualityMetric: string;
  value: number;
  discountPercentage: number;
  discountAmount: number;
}

interface AppliedThreshold {
  qualityMetric: string;
  minValue: number;
  maxValue: number;
  discountPercentage: number;
}
```

**Errors**:
- `400`: Invalid reception data
- `422`: Cannot calculate pricing (e.g., pricing disabled, missing metrics)
- `500`: Calculation error

---

### 2. Save Reception with Pricing

**Endpoint**: `server action: saveReceptionWithPricing`

**Purpose**: Save reception with automatic pricing calculation

**Request**:

```typescript
interface SaveReceptionWithPricingRequest {
  // Reception data
  farmerId: string;
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  totalWeight: number;
  basePricePerKg: number;

  // Quality evaluation
  qualityEvaluation: QualityMetricValue[];

  // Additional reception fields...
}
```

**Response**:

```typescript
interface SaveReceptionWithPricingResponse {
  success: boolean;
  reception: {
    id: string;
    // ... other reception fields
  };
  pricingCalculation: PricingCalculation;
}

interface PricingCalculation {
  id: string;
  receptionId: string;
  basePricePerKg: number;
  totalWeight: number;
  grossValue: number;
  totalDiscountAmount: number;
  finalTotal: number;
  calculationData: CalculationDataDetail;
  createdAt: string;
}

interface CalculationDataDetail {
  qualityMetrics: DiscountBreakdownItem[];
  totalDiscounts: number;
  timestamp: string;
  fruitType: string;
  thresholds: AppliedThreshold[];
}
```

**Validation**:
- All quality metrics must be recorded
- Quality-based pricing must be enabled (if thresholds exist)
- Base price and weight must be positive

**Errors**:
- `400`: Invalid reception data
- `422`: Missing required quality metrics
- `500`: Save failed

**Note**: This is a transaction - if pricing calculation fails, reception is not saved.

---

### 3. Get Reception Pricing

**Endpoint**: `server action: getReceptionPricing`

**Purpose**: Retrieve pricing calculation for a specific reception

**Request**:

```typescript
interface GetReceptionPricingRequest {
  receptionId: string;
}
```

**Response**:

```typescript
interface GetReceptionPricingResponse {
  pricingCalculation: PricingCalculation;
}
```

**Errors**:
- `404`: Reception or pricing calculation not found
- `403`: Unauthorized

---

### 4. Get Historical Pricing Breakdown

**Endpoint**: `server action: getHistoricalPricingBreakdown`

**Purpose**: Get detailed breakdown of pricing for auditing

**Request**:

```typescript
interface GetHistoricalPricingBreakdownRequest {
  receptionId: string;
}
```

**Response**:

```typescript
interface GetHistoricalPricingBreakdownResponse {
  reception: {
    id: string;
    date: string;
    fruitType: string;
    totalWeight: number;
  };
  pricingCalculation: PricingCalculation;
  currentPricingRules?: {
    // Show current rules for comparison
    thresholds: AppliedThreshold[];
    enabled: boolean;
  };
  comparison?: {
    wouldChange: boolean;
    newTotal?: number;
    difference?: number;
  };
}
```

**Errors**:
- `404`: Reception not found
- `403`: Unauthorized

---

### 5. Bulk Calculate Pricing

**Endpoint**: `server action: bulkCalculatePricing`

**Purpose**: Calculate pricing for multiple receptions (e.g., for reports)

**Request**:

```typescript
interface BulkCalculatePricingRequest {
  receptionIds: string[];
}
```

**Response**:

```typescript
interface BulkCalculatePricingResponse {
  results: Array<{
    receptionId: string;
    success: boolean;
    pricingCalculation?: PricingCalculation;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
```

**Errors**:
- `400`: Invalid reception IDs
- `500`: Bulk calculation error

---

## Common Types

### Pricing Calculation

```typescript
// Immutable snapshot stored in database
interface PricingCalculation {
  id: string;                    // UUID
  receptionId: string;           // UUID
  basePricePerKg: number;        // Decimal
  totalWeight: number;           // Decimal
  grossValue: number;            // Decimal (basePrice × weight)
  totalDiscountAmount: number;   // Decimal
  finalTotal: number;            // Decimal (gross - discounts)
  calculationData: {             // JSONB
    qualityMetrics: Array<{
      metric: string;
      value: number;
      discountPercentage: number;
      discountAmount: number;
    }>;
    totalDiscounts: number;
    timestamp: string;           // ISO 8601
    fruitType: string;
    thresholds: Array<{
      qualityMetric: string;
      minValue: number;
      maxValue: number;
      discountPercentage: number;
    }>;
  };
  createdAt: string;            // ISO 8601
  createdBy?: string;           // UUID
}
```

---

## Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      value?: unknown;
      constraint?: string;
    };
  };
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `CALCULATION_ERROR`: Pricing calculation failed
- `MISSING_QUALITY_METRICS`: Required quality data not provided
- `PRICING_DISABLED`: Quality-based pricing not enabled
- `INTERNAL_ERROR`: Server error

---

## Usage Examples

### Calculate Pricing Before Save

```typescript
const preview = await calculateReceptionPricing({
  fruitType: 'Café',
  totalWeight: 100,
  basePricePerKg: 5.00,
  qualityEvaluation: [
    { metric: 'Violetas', value: 12 },
    { metric: 'Humedad', value: 15 },
    { metric: 'Moho', value: 8 }
  ]
});

if (preview.canCalculate) {
  console.log(`Final Total: $${preview.pricingCalculation?.finalTotal}`);
}
```

### Save Reception with Pricing

```typescript
const result = await saveReceptionWithPricing({
  farmerId: ' farmer-123',
  fruitType: 'Café',
  totalWeight: 100,
  basePricePerKg: 5.00,
  qualityEvaluation: [
    { metric: 'Violetas', value: 12 },
    { metric: 'Humedad', value: 15 },
    { metric: 'Moho', value: 8 }
  ]
});

console.log(`Reception saved with pricing: ${result.pricingCalculation.finalTotal}`);
```

### Get Historical Pricing Details

```typescript
const history = await getHistoricalPricingBreakdown({
  receptionId: 'reception-123'
});

console.log('Original calculation:', history.pricingCalculation);
console.log('Current rules:', history.currentPricingRules);
```

---

## Pricing Calculation Logic

```typescript
function calculatePricing(
  basePricePerKg: number,
  totalWeight: number,
  qualityEvaluation: QualityMetricValue[],
  thresholds: DiscountThreshold[]
): PricingCalculationPreview {
  const grossValue = basePricePerKg * totalWeight;
  const discountBreakdown: DiscountBreakdownItem[] = [];
  let totalDiscountAmount = 0;

  // For each quality metric, find applicable thresholds
  for (const metric of qualityEvaluation) {
    const applicableThresholds = thresholds.filter(t =>
      t.qualityMetric === metric.metric &&
      metric.value >= t.minValue &&
      metric.value <= t.maxValue
    );

    // Apply all matching thresholds
    for (const threshold of applicableThresholds) {
      const discountAmount = grossValue * (threshold.discountPercentage / 100);
      totalDiscountAmount += discountAmount;

      discountBreakdown.push({
        qualityMetric: metric.metric,
        value: metric.value,
        discountPercentage: threshold.discountPercentage,
        discountAmount
      });
    }
  }

  return {
    basePricePerKg,
    totalWeight,
    grossValue,
    totalDiscountAmount,
    finalTotal: grossValue - totalDiscountAmount,
    discountBreakdown,
    appliedThresholds: thresholds
  };
}
```

---

**Status**: Contract definition complete