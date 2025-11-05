# Pricing Rules API Contracts

## Endpoints

### 1. Get Pricing Rules by Fruit Type

**Endpoint**: `server action: getPricingRules`

**Purpose**: Retrieve pricing configuration and thresholds for a specific fruit type

**Request**:

```typescript
interface GetPricingRulesRequest {
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
}
```

**Response**:

```typescript
interface GetPricingRulesResponse {
  id: string;
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  qualityBasedPricingEnabled: boolean;
  thresholds: DiscountThreshold[];
  createdAt: string;
  updatedAt: string;
}

interface DiscountThreshold {
  id: string;
  qualityMetric: 'Violetas' | 'Humedad' | 'Moho';
  minValue: number;
  maxValue: number;
  discountPercentage: number;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- `404`: Fruit type not found
- `403`: Unauthorized (not authenticated)

---

### 2. Update Pricing Rules

**Endpoint**: `server action: updatePricingRules`

**Purpose**: Enable/disable quality-based pricing for a fruit type

**Request**:

```typescript
interface UpdatePricingRulesRequest {
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  qualityBasedPricingEnabled: boolean;
}
```

**Response**:

```typescript
interface UpdatePricingRulesResponse {
  success: boolean;
  pricingRule: PricingRule;
}

interface PricingRule {
  id: string;
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
  qualityBasedPricingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- `400`: Invalid fruit type or boolean value
- `403`: Unauthorized (not admin)
- `500`: Update failed

**Authorization**: Administrators only

---

### 3. Create Discount Threshold

**Endpoint**: `server action: createDiscountThreshold`

**Purpose**: Add a new discount threshold for a quality metric

**Request**:

```typescript
interface CreateDiscountThresholdRequest {
  pricingRuleId: string;
  qualityMetric: 'Violetas' | 'Humedad' | 'Moho';
  minValue: number;
  maxValue: number;
  discountPercentage: number; // 0-100
}
```

**Response**:

```typescript
interface CreateDiscountThresholdResponse {
  success: boolean;
  threshold: DiscountThreshold;
}
```

**Validation**:
- `minValue` must be ≥ 0
- `maxValue` must be ≥ `minValue`
- `discountPercentage` must be between 0 and 100
- `pricingRuleId` must exist

**Errors**:
- `400`: Invalid threshold values
- `404`: Pricing rule not found
- `403`: Unauthorized (not admin)
- `500`: Create failed

**Authorization**: Administrators only

---

### 4. Update Discount Threshold

**Endpoint**: `server action: updateDiscountThreshold`

**Purpose**: Modify an existing discount threshold

**Request**:

```typescript
interface UpdateDiscountThresholdRequest {
  id: string;
  minValue: number;
  maxValue: number;
  discountPercentage: number;
}
```

**Response**:

```typescript
interface UpdateDiscountThresholdResponse {
  success: boolean;
  threshold: DiscountThreshold;
}
```

**Validation**:
- Same as Create
- Threshold must exist

**Errors**:
- `400`: Invalid threshold values
- `404`: Threshold not found
- `403`: Unauthorized (not admin)
- `500`: Update failed

**Authorization**: Administrators only

---

### 5. Delete Discount Threshold

**Endpoint**: `server action: deleteDiscountThreshold`

**Purpose**: Remove a discount threshold

**Request**:

```typescript
interface DeleteDiscountThresholdRequest {
  id: string;
}
```

**Response**:

```typescript
interface DeleteDiscountThresholdResponse {
  success: boolean;
  deletedId: string;
}
```

**Errors**:
- `404`: Threshold not found
- `403`: Unauthorized (not admin)
- `500`: Delete failed

**Authorization**: Administrators only

---

### 6. Get All Discount Thresholds

**Endpoint**: `server action: getAllDiscountThresholds`

**Purpose**: Retrieve all thresholds for a fruit type (for configuration UI)

**Request**:

```typescript
interface GetAllDiscountThresholdsRequest {
  fruitType: 'Café' | 'Cacao' | 'Miel' | 'Cocos';
}
```

**Response**:

```typescript
interface GetAllDiscountThresholdsResponse {
  thresholds: DiscountThreshold[];
}
```

**Errors**:
- `404`: Fruit type not found
- `403`: Unauthorized

---

## Common Error Response Format

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
- `INTERNAL_ERROR`: Server error

---

## Usage Examples

### Enable Quality-Based Pricing for Café

```typescript
// Step 1: Get current configuration
const rules = await getPricingRules({ fruitType: 'Café' });

// Step 2: Update to enable
const updated = await updatePricingRules({
  fruitType: 'Café',
  qualityBasedPricingEnabled: true
});
```

### Add a Discount Threshold

```typescript
await createDiscountThreshold({
  pricingRuleId: '123e4567-e89b-12d3-a456-426614174000',
  qualityMetric: 'Violetas',
  minValue: 10,
  maxValue: 25,
  discountPercentage: 5
});
```

### Get Thresholds for Configuration UI

```typescript
const { thresholds } = await getAllDiscountThresholds({
  fruitType: 'Café'
});

// Group by quality metric
const byMetric = thresholds.reduce((acc, t) => {
  if (!acc[t.qualityMetric]) acc[t.qualityMetric] = [];
  acc[t.qualityMetric].push(t);
  return acc;
}, {} as Record<string, DiscountThreshold[]>);
```

---

**Status**: Contract definition complete