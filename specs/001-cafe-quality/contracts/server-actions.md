# Server Actions Contract: Quality Evaluation

**Phase**: 1 - Design
**Date**: 2025-10-31

## Server Actions Overview

Quality evaluation operations are implemented as Next.js Server Actions, following the existing pattern in the codebase.

## Action 1: createQualityEvaluation

### Purpose
Create a new quality evaluation record for a Café Seco reception.

### Signature
```typescript
export async function createQualityEvaluation(
  data: CreateQualityEvaluationData
): Promise<{ success: boolean; data?: CalidadCafe; error?: string }>
```

### Parameters
```typescript
interface CreateQualityEvaluationData {
  recepcion_id: string;
  violetas: number;
  humedad: number;
  moho: number;
}
```

### Validation
- **recepcion_id**: Must be a valid UUID
- **recepcion_id**: Must reference an existing reception with fruit_type='CAFÉ' and fruit_subtype='Seco'
- **violetas**: Must be a number between 0 and 100 (inclusive)
- **humedad**: Must be a number between 0 and 100 (inclusive)
- **moho**: Must be a number between 0 and 100 (inclusive)
- **User role**: Must be 'admin'
- **Session**: Must be authenticated

### Success Response
```typescript
{
  success: true,
  data: {
    id: string;
    recepcion_id: string;
    violetas: number;
    humedad: number;
    moho: number;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
  }
}
```

### Error Cases
- **UNAUTHORIZED**: User not logged in
- **FORBIDDEN**: User role is not 'admin'
- **INVALID_RECEPTION**: Reception doesn't exist or isn't Café Seco
- **VALIDATION_ERROR**: Invalid parameter values
- **DUPLICATE**: Quality evaluation already exists for this reception
- **SERVER_ERROR**: Database or server error

## Action 2: updateQualityEvaluation

### Purpose
Update an existing quality evaluation record.

### Signature
```typescript
export async function updateQualityEvaluation(
  recepcionId: string,
  data: UpdateQualityEvaluationData
): Promise<{ success: boolean; data?: CalidadCafe; error?: string }>
```

### Parameters
```typescript
interface UpdateQualityEvaluationData {
  violetas?: number;
  humedad?: number;
  moho?: number;
}
```

### Validation
- **recepcionId**: Must be a valid UUID and must have existing quality evaluation
- **violetas**: Optional, if provided must be between 0 and 100
- **humedad**: Optional, if provided must be between 0 and 100
- **moho**: Optional, if provided must be between 0 and 100
- **User role**: Must be 'admin'
- **Session**: Must be authenticated

### Success Response
```typescript
{
  success: true,
  data: {
    id: string;
    recepcion_id: string;
    violetas: number;
    humedad: number;
    moho: number;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
  }
}
```

### Error Cases
- **UNAUTHORIZED**: User not logged in
- **FORBIDDEN**: User role is not 'admin'
- **NOT_FOUND**: Quality evaluation doesn't exist for this reception
- **VALIDATION_ERROR**: Invalid parameter values
- **SERVER_ERROR**: Database or server error

## Action 3: getQualityEvaluation

### Purpose
Retrieve quality evaluation data for a specific reception.

### Signature
```typescript
export async function getQualityEvaluation(
  recepcionId: string
): Promise<{ success: boolean; data?: CalidadCafe | null; error?: string }>
```

### Parameters
- **recepcionId**: Must be a valid UUID

### Validation
- **recepcionId**: Must be a valid UUID
- **Session**: Must be authenticated (any role can view)

### Success Response
```typescript
{
  success: true,
  data: {
    id: string;
    recepcion_id: string;
    violetas: number;
    humedad: number;
    moho: number;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
  } | null  // null if no quality evaluation exists
}
```

### Error Cases
- **UNAUTHORIZED**: User not logged in
- **INVALID_RECEPTION_ID**: Invalid UUID format
- **SERVER_ERROR**: Database or server error

## Action 4: getQualityEvaluationWithReception

### Purpose
Retrieve quality evaluation data with full reception details (for detailed views).

### Signature
```typescript
export async function getQualityEvaluationWithReception(
  recepcionId: string
): Promise<{
  success: boolean;
  data?: QualityEvaluationWithReception | null;
  error?: string;
}>
```

### Parameters
- **recepcionId**: Must be a valid UUID

### Validation
- **recepcionId**: Must be a valid UUID
- **Session**: Must be authenticated (any role can view)

### Success Response
```typescript
{
  success: true,
  data: {
    quality: {
      id: string;
      recepcion_id: string;
      violetas: number;
      humedad: number;
      moho: number;
      created_by: string;
      updated_by: string;
      created_at: string;
      updated_at: string;
    } | null;
    reception: {
      id: string;
      reception_number: string;
      provider_id: string;
      driver_id: string;
      fruit_type: string;
      fruit_subtype: string;
      total_containers: number;
      total_weight: number;
      status: string;
      created_at: string;
    };
    created_by_user: {
      id: string;
      username: string;
    };
    updated_by_user: {
      id: string;
      username: string;
    };
  } | null
}
```

### Error Cases
- **UNAUTHORIZED**: User not logged in
- **INVALID_RECEPTION_ID**: Invalid UUID format
- **RECEPTION_NOT_FOUND**: Reception doesn't exist
- **SERVER_ERROR**: Database or server error

## Type Definitions

```typescript
interface CalidadCafe {
  id: string;
  recepcion_id: string;
  violetas: number;
  humedad: number;
  moho: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface QualityEvaluationWithReception {
  quality: CalidadCafe | null;
  reception: {
    id: string;
    reception_number: string;
    provider_id: string;
    driver_id: string;
    fruit_type: string;
    fruit_subtype: string;
    total_containers: number;
    total_weight: number;
    status: string;
    created_at: string;
  };
  created_by_user: {
    id: string;
    username: string;
  };
  updated_by_user: {
    id: string;
    username: string;
  };
}
```

## Error Response Format

All server actions return errors in the following format:
```typescript
{
  success: false,
  error: string;  // Human-readable error message
}
```

Common error messages:
- "Unauthorized: Please log in"
- "Forbidden: Only administrators can perform this action"
- "Invalid reception: Reception not found or not eligible for quality evaluation"
- "Validation failed: Quality values must be between 0 and 100"
- "Quality evaluation already exists for this reception"
- "Server error: Please try again later"

---

**Server actions contract completed**: 2025-10-31
**Implementation location**: `lib/actions/quality-cafe.ts`
