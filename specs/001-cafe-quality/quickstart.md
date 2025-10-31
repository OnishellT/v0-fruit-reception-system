# Quickstart Guide: Quality Evaluation Feature

**Phase**: 1 - Design
**Date**: 2025-10-31

## Overview

This guide provides a concise overview for implementing the Post-Reception Quality Evaluation feature for Café Seco.

## Implementation Checklist

### Phase 1: Database Setup

- [ ] **Create migration script**: `scripts/10-add-quality-cafe-table.sql`
  - Create `calidad_cafe` table with all required fields
  - Add foreign key constraints to `receptions` and `users`
  - Add CHECK constraints for quality metrics (0-100 range)
  - Add unique constraint on `recepcion_id`
  - Create indexes for performance
  - Add RLS policies for secure access

- [ ] **Run migration**
  ```bash
  # Apply to database
  psql -d your_database -f scripts/10-add-quality-cafe-table.sql
  ```

### Phase 2: Server Actions

- [ ] **Create**: `lib/actions/quality-cafe.ts`
  - Export `createQualityEvaluation()` function
  - Export `updateQualityEvaluation()` function
  - Export `getQualityEvaluation()` function
  - Export `getQualityEvaluationWithReception()` function
  - Implement Zod validation schemas
  - Add proper error handling
  - Follow existing patterns from `lib/actions/*.ts`

- [ ] **Create TypeScript types**
  - Add to `lib/types/` if needed
  - Export `CalidadCafe` interface
  - Export parameter and response types

### Phase 3: UI Components

- [ ] **Create**: `components/quality-evaluation-modal.tsx`
  - Implement modal with proper state management
  - Add role-based mode switching (edit/view/read-only)
  - Implement client-side validation with Zod
  - Add proper error handling and user feedback
  - Follow existing modal patterns in codebase

- [ ] **Update**: `components/data-table.tsx` (or receptions table component)
  - Add conditional "Registrar Calidad" button
  - Button visible only for CAFÉ + Seco
  - Button label changes based on existing quality data
  - Integrate quality indicators

- [ ] **Update**: `app/dashboard/reception/page.tsx`
  - Import and use quality evaluation modal
  - Add state management for modal open/close
  - Fetch quality data for each row
  - Pass props to modal component

### Phase 4: Integration

- [ ] **Update reception page actions**
  - Add quality data to fetch queries
  - Integrate quality server actions
  - Handle refresh after quality data operations

- [ ] **Update authentication checks**
  - Ensure user role is passed to components
  - Verify server actions check permissions

### Phase 5: Testing

- [ ] **Create**: `tests/test-quality-cafe.js`
  - Test button visibility for different fruit types
  - Test quality data entry workflow
  - Test permission enforcement (admin vs operator)
  - Test modal open/close behavior
  - Test validation (0-100 range)
  - Test data persistence

- [ ] **Run existing tests**
  - Ensure no regressions in existing functionality
  - Verify 9/9 CRUD tests still pass

## Key Implementation Details

### Database Schema

```sql
CREATE TABLE calidad_cafe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
  violetas DECIMAL(5,2) NOT NULL CHECK (violetas >= 0 AND violetas <= 100),
  humedad DECIMAL(5,2) NOT NULL CHECK (humedad >= 0 AND humedad <= 100),
  moho DECIMAL(5,2) NOT NULL CHECK (moho >= 0 AND moho <= 100),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recepcion_id)
);
```

### Server Action Example

```typescript
// lib/actions/quality-cafe.ts
export async function createQualityEvaluation(data: CreateQualityEvaluationData) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  if (session.user.role !== 'admin') {
    return { success: false, error: "Forbidden: Only administrators can modify quality data" };
  }

  // Validate with Zod
  const validated = qualitySchema.parse(data);

  // Create quality evaluation
  const result = await createServiceRoleClient()
    .from('calidad_cafe')
    .insert({
      recepcion_id: validated.recepcion_id,
      violetas: validated.violetas,
      humedad: validated.humedad,
      moho: validated.moho,
      created_by: session.user.id,
      updated_by: session.user.id,
    })
    .select()
    .single();

  if (result.error) {
    return { success: false, error: "Server error: " + result.error.message };
  }

  return { success: true, data: result.data };
}
```

### Modal Button Logic

```tsx
// In Receptions table component
const getQualityButton = (reception) => {
  // Only show for Café Seco
  if (reception.fruit_type !== 'CAFÉ' || reception.fruit_subtype !== 'Seco') {
    return null;
  }

  // Check if quality data exists
  if (reception.quality_data) {
    return (
      <Button onClick={() => openModal(reception.id)}>
        {user.role === 'admin' ? 'Editar Calidad' : 'Ver Calidad'}
      </Button>
    );
  }

  // No quality data
  return (
    <Button onClick={() => openModal(reception.id)}>
      Registrar Calidad
    </Button>
  );
};
```

## Testing Quick Reference

### E2E Test Flow

```javascript
// tests/test-quality-cafe.js
test('Admin can create quality evaluation for Café Seco', async ({ page }) => {
  // Login as admin
  await loginAsAdmin(page);

  // Navigate to receptions
  await page.goto('/dashboard/reception');

  // Verify button is visible for Café Seco
  const cafeSecoReception = page.locator('[data-reception-id="..."]');
  await expect(cafeSecoReception.locator('button:has-text("Registrar Calidad")')).toBeVisible();

  // Click button and fill form
  await cafeSecoReception.locator('button:has-text("Registrar Calidad")').click();
  await page.fill('[name="violetas"]', '15.50');
  await page.fill('[name="humedad"]', '12.30');
  await page.fill('[name="moho"]', '3.20');
  await page.click('button:has-text("Guardar")');

  // Verify success
  await expect(page.locator('text=Calidad registrada')).toBeVisible();
});
```

## Common Pitfalls

### 1. Permission Checks
- **Problem**: Forgetting to check user role in server actions
- **Solution**: Always verify `session.user.role === 'admin'` before mutations

### 2. Validation
- **Problem**: Only validating on client side
- **Solution**: Always validate with Zod in server actions too

### 3. Button Visibility
- **Problem**: Showing button for non-Café Seco receptions
- **Solution**: Double-check fruit_type AND fruit_subtype conditions

### 4. RLS Policies
- **Problem**: Incorrect or missing RLS policies
- **Solution**: Test with both admin and operator roles, verify permissions

### 5. Modal State
- **Problem**: Modal not closing after save
- **Solution**: Ensure onSaved callback properly refreshes data and closes modal

## Deployment Checklist

- [ ] Run database migration on production
- [ ] Build passes without errors
- [ ] All tests pass (9/9 CRUD + new quality tests)
- [ ] TypeScript strict mode passes
- [ ] E2E tests pass in staging environment
- [ ] Verify RLS policies work correctly
- [ ] Test with both admin and operator roles
- [ ] Verify Spanish localization throughout

## Monitoring

### Metrics to Track
- Number of quality evaluations created per day
- Time to complete quality evaluation (user flow)
- Error rate in quality data entry
- Permission violations (should be zero)

### Logs to Monitor
- Server action invocations (create/update/get)
- Validation failures
- Permission denials
- Database errors

## Rollback Plan

If issues arise:

1. **Disable quality button**: Remove quality button rendering from table
2. **Hide quality data**: Update queries to exclude quality data
3. **Database rollback**: Run migration down script if needed
4. **Remove components**: Delete modal and server actions

---

**Quickstart guide completed**: 2025-10-31
**Estimated implementation time**: 2-3 days
**Prerequisites**: Database migration, Next.js familiarity, Supabase knowledge
