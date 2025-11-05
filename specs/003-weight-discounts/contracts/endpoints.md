# API Endpoints Specification: Weight Discount System

**Date**: 2025-10-31
**Version**: 1.0.0

## Overview

This specification defines the server actions and API endpoints for the weight discount calculation system. All operations use Next.js server actions with proper authentication and validation.

## Server Actions

### 1. Calculate Weight Discounts

**Action**: `calculateWeightDiscounts`

**Description**: Calculates weight-based discounts based on quality evaluation data and pricing thresholds.

**Request**:
```typescript
interface CalculateWeightDiscountsRequest {
  reception_id: string;
  total_weight: number;
  quality_data: {
    moho: number;
    humedad: number;
    violetas: number;
  };
  fruit_type_id: string;
}
```

**Response**:
```typescript
interface CalculateWeightDiscountsResponse {
  success: boolean;
  data?: {
    total_peso_original: number;
    total_peso_descuento: number;
    total_peso_final: number;
    breakdown: Array<{
      parametro: 'Moho' | 'Humedad' | 'Violetas';
      umbral: number;
      valor: number;
      porcentaje_descuento: number;
      peso_descuento: number;
    }>;
  };
  error?: string;
}
```

**Implementation Details**:
- Validates quality data ranges (0-100)
- Fetches applicable pricing thresholds from database
- Calculates weight discounts for each exceeded threshold
- Stores results in `desglose_descuentos` table
- Updates `receptions` table with weight discount fields

**Error Handling**:
- `400`: Invalid input data
- `404`: Reception or pricing rules not found
- `403`: Insufficient permissions
- `500`: Calculation failed

### 2. Get Discount Breakdown

**Action**: `getDiscountBreakdown`

**Description**: Retrieves the discount breakdown for a specific reception.

**Request**:
```typescript
interface GetDiscountBreakdownRequest {
  reception_id: string;
}
```

**Response**:
```typescript
interface GetDiscountBreakdownResponse {
  success: boolean;
  data?: Array<{
    parametro: string;
    umbral: number;
    valor: number;
    porcentaje_descuento: number;
    peso_descuento: number;
  }>;
  error?: string;
}
```

**Implementation Details**:
- Fetches discount breakdown items from `desglose_descuentos` table
- Applies RLS policies for user access control
- Returns empty array if no discounts applied

**Error Handling**:
- `404`: Reception not found
- `403`: Insufficient permissions
- `500`: Database error

### 3. Admin Override Weight Discounts

**Action**: `adminOverrideWeightDiscounts`

**Description**: Allows administrators to manually override discount calculations.

**Request**:
```typescript
interface AdminOverrideRequest {
  reception_id: string;
  total_peso_original: number;
  total_peso_descuento: number;
  total_peso_final: number;
  override_reason: string;
  breakdown?: Array<{
    parametro: string;
    umbral: number;
    valor: number;
    porcentaje_descuento: number;
    peso_descuento: number;
  }>;
}
```

**Response**:
```typescript
interface AdminOverrideResponse {
  success: boolean;
  data?: {
    reception_id: string;
    original_calculation: WeightDiscountCalculation;
    override_calculation: WeightDiscountCalculation;
    override_timestamp: string;
    overridden_by: string;
  };
  error?: string;
}
```

**Implementation Details**:
- Validates admin permissions
- Creates audit log entry for override
- Updates discount breakdown records
- Records override reason and timestamp

**Error Handling**:
- `401`: Not authenticated
- `403`: Insufficient admin permissions
- `404`: Reception not found
- `400`: Invalid override data
- `500`: Update failed

## Database Operations

### 1. Create Discount Breakdown

```sql
INSERT INTO desglose_descuentos (
  recepcion_id,
  parametro,
  umbral,
  valor,
  porcentaje_descuento,
  peso_descuento,
  created_by
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
ON CONFLICT (recepcion_id, parametro)
DO UPDATE SET
  umbral = EXCLUDED.umbral,
  valor = EXCLUDED.valor,
  porcentaje_descuento = EXCLUDED.porcentaje_descuento,
  peso_descuento = EXCLUDED.peso_descuento,
  created_at = NOW(),
  created_by = EXCLUDED.created_by;
```

### 2. Update Reception Weight Fields

```sql
UPDATE receptions
SET
  total_peso_original = $1,
  total_peso_descuento = $2,
  total_peso_final = $3,
  updated_at = NOW()
WHERE id = $4;
```

### 3. Get Pricing Thresholds

```sql
SELECT
  dt.quality_metric,
  dt.min_value,
  dt.max_value,
  dt.discount_percentage
FROM discount_thresholds dt
JOIN pricing_rules pr ON dt.pricing_rule_id = pr.id
WHERE pr.fruit_type = $1
  AND pr.quality_based_pricing_enabled = true
ORDER BY dt.quality_metric, dt.min_value;
```

## Validation Rules

### Input Validation

1. **Quality Data Validation**:
   - All values must be between 0 and 100
   - Data type must be numeric
   - Required fields: moho, humedad, violetas

2. **Weight Validation**:
   - Total weight must be positive (> 0)
   - Decimal precision limited to 2 places
   - Maximum weight: 99,999.99 kg

3. **Discount Validation**:
   - Discount percentages between 0 and 100
   - Weight discounts cannot exceed original weight
   - Final weight must be non-negative

4. **Permission Validation**:
   - User must be authenticated
   - User must have access to reception provider
   - Admin overrides require admin role

### Business Logic Validation

1. **Threshold Application**:
   - Quality values compared against configured thresholds
   - Only apply discount when value exceeds minimum threshold
   - Multiple thresholds handled independently

2. **Calculation Logic**:
   - Original weight preserved before discounts
   - Each quality metric can contribute to total discount
   - Final weight = original weight - total discounts

3. **Audit Requirements**:
   - All calculations tracked with user attribution
   - Override actions logged with reasons
   - Immutable calculation records maintained

## Error Responses

### Standard Error Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User lacks required permissions
- `RECEPTION_NOT_FOUND`: Reception does not exist or inaccessible
- `THRESHOLD_NOT_FOUND`: No pricing rules configured for fruit type
- `CALCULATION_FAILED`: Unexpected error during calculation
- `ADMIN_REQUIRED`: Operation requires administrator privileges
- `INVALID_OVERRIDE_DATA`: Override data fails validation

## Rate Limiting

- Calculation requests: 100 requests per minute per user
- Admin overrides: 10 requests per minute per admin
- Breakdown retrieval: 200 requests per minute per user

## Security Headers

All server actions include:
- Content-Type: application/json
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security: max-age=31536000

## Testing Requirements

### Unit Tests
- Input validation schemas
- Calculation logic functions
- Error handling scenarios

### Integration Tests
- End-to-end discount calculation flow
- Admin override workflow
- Permission enforcement

### E2E Tests
- Complete discount calculation user journey
- Mobile responsive behavior
- Cross-browser compatibility

## Monitoring

### Metrics to Track
- Calculation request volume and response times
- Error rates by error type
- Override frequency by admin users
- User satisfaction with discount transparency

### Logging
- All calculation requests with parameters
- Admin override actions with reasons
- Permission denials for security monitoring
- Performance metrics for optimization