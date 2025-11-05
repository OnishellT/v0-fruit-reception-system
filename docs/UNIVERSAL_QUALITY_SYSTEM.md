# Universal Quality Discount System

## Overview
This document describes the migration from a **CAFÉ SECO-only quality system** to a **universal quality discount system** that works for all fruit types.

## Changes Made

### 1. Database Migration

#### New Table: `quality_evaluations`
- **Replaces**: `calidad_cafe` table (now removed)
- **Purpose**: Store quality metrics for ALL fruit types
- **Columns**:
  - `id` (UUID, Primary Key)
  - `recepcion_id` (UUID, Foreign Key to receptions)
  - `violetas` (DECIMAL, 0-100%)
  - `humedad` (DECIMAL, 0-100%)
  - `moho` (DECIMAL, 0-100%)
  - `created_by` (UUID, Foreign Key to users)
  - `updated_by` (UUID, Foreign Key to users)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

#### Removed Table: `calidad_cafe`
- This table was specific to CAFÉ SECO only
- Now replaced by the universal `quality_evaluations` table
- All data has been migrated to the new table

#### New View: `quality_discount_calculations`
- Combines quality evaluations with discount thresholds
- Calculates applicable discounts for each metric
- Used by the trigger system to auto-apply discounts

#### New Function: `apply_quality_discounts(recepcion_id UUID)`
- Calculates and applies quality-based discounts
- Uses `discount_thresholds` table to determine discount amounts
- Stores results in `desglose_descuentos` table
- Updates reception weight fields

#### New Trigger: `auto_apply_quality_discounts`
- Automatically triggers when quality evaluation is created/updated
- Calls `apply_quality_discounts()` function
- Ensures discounts are always in sync with quality data

### 2. Type System Changes

#### New Type File: `lib/types/quality-universal.ts`
- **Replaces**: `lib/types/quality-cafe.ts`
- **Contains**:
  - `QualityEvaluation` interface
  - `CreateQualityEvaluationData`
  - `UpdateQualityEvaluationData`
  - `QualityEvaluationResponse`
  - `QualityEvaluationWithReception`

#### Updated Server Actions: `lib/actions/quality-universal.ts`
- **Replaces**: `lib/actions/quality-cafe.ts`
- **Functions**:
  - `createQualityEvaluation()` - Creates quality data for any fruit type
  - `updateQualityEvaluation()` - Updates quality data
  - `getQualityEvaluation()` - Retrieves quality data
  - `getQualityEvaluationWithReception()` - Gets quality with full reception details
  - `deleteQualityEvaluation()` - Removes quality data

### 3. UI Components

#### Updated: `components/quality-evaluation-modal.tsx`
- Changed imports to use `quality-universal` types
- Dynamic title shows fruit type instead of "Café Seco"
- Now works for all fruit types

#### Updated: `app/dashboard/reception/receptions-table-client.tsx`
- Removed CAFÉ SECO restriction (`isCafeSeco` function removed)
- Quality evaluation button now visible for ALL fruit types
- Updated property names from `calidad_cafe` to `quality_evaluations`
- Quality button text dynamic based on data presence

### 4. API Actions

#### Updated: `lib/actions/reception.ts`
- Updated to use `quality_evaluations` table
- Changed property from `calidad_cafe` to `quality_evaluations`

## How It Works Now

### Flow for Any Fruit Type (CAFÉ, CACAO, MIEL, COCOS)

1. **Create Quality Evaluation**
   - Admin clicks "Calidad" button on any reception
   - Quality evaluation modal opens (dynamic title shows fruit type)
   - Admin enters quality values (Violetas, Humedad, Moho)
   - Data saved to `quality_evaluations` table

2. **Automatic Discount Calculation**
   - Trigger detects quality evaluation save/update
   - Calls `apply_quality_discounts()` function
   - Function:
     - Fetches quality data from `quality_evaluations`
     - Gets fruit type from reception
     - Looks up applicable thresholds in `discount_thresholds`
     - Calculates discount for each metric
     - Stores breakdown in `desglose_descuentos`
     - Updates reception weight fields

3. **View Discounts**
   - Discount breakdown visible in reception details
   - Shows which metrics triggered discounts
   - Shows discount amounts and percentages

### Discount Calculation Logic

For each quality metric (Violetas, Humedad, Moho):
1. Get the actual value from `quality_evaluations`
2. Find matching threshold in `discount_thresholds`:
   - Metric name must match
   - Value must be within min/max range
3. If threshold found:
   - Calculate weight discount: `total_weight × (discount_percentage / 100)`
   - Store in `desglose_descuentos`
   - Update reception totals

## Benefits

1. **Universal Application**: Quality discounts now work for all fruit types
2. **Simplified Code**: One system instead of special case for CAFÉ SECO
3. **Consistent Data**: All quality data in one table
4. **Automatic Calculation**: Triggers ensure discounts are always accurate
5. **Better Maintainability**: Easier to add new quality metrics or fruit types

## Migration Steps

### Step 1: Run Database Migration
```sql
-- Run the migration script
\i /home/dev/Documents/v0-fruit-reception-system/scripts/18-universal-quality-system.sql
```

This will:
- Create `quality_evaluations` table
- Create RLS policies
- Create helper views and functions
- Copy data from `calidad_cafe` to `quality_evaluations`
- Apply discounts to existing receptions
- Remove `calidad_cafe` table

### Step 2: Deploy Code Changes
- New type file: `lib/types/quality-universal.ts`
- New actions file: `lib/actions/quality-universal.ts`
- Updated components and pages

### Step 3: Verify Functionality
1. Create a quality evaluation for any fruit type
2. Verify discounts are calculated and stored
3. Check reception weight fields are updated
4. View discount breakdown in UI

## Testing Checklist

- [ ] Quality evaluation can be created for CAFÉ
- [ ] Quality evaluation can be created for CACAO
- [ ] Quality evaluation can be created for MIEL
- [ ] Quality evaluation can be created for COCOS
- [ ] Discounts are calculated correctly
- [ ] Discount breakdown is displayed in UI
- [ ] Reception weight fields are updated
- [ ] Existing quality data is preserved
- [ ] Admin permissions work correctly
- [ ] Trigger auto-applies discounts

## Files Created/Modified

### Created
- `/home/dev/Documents/v0-fruit-reception-system/scripts/18-universal-quality-system.sql`
- `/home/dev/Documents/v0-fruit-reception-system/lib/types/quality-universal.ts`
- `/home/dev/Documents/v0-fruit-reception-system/lib/actions/quality-universal.ts`

### Modified
- `/home/dev/Documents/v0-fruit-reception-system/components/quality-evaluation-modal.tsx`
- `/home/dev/Documents/v0-fruit-reception-system/app/dashboard/reception/receptions-table-client.tsx`
- `/home/dev/Documents/v0-fruit-reception-system/lib/actions/reception.ts`

### Removed
- `/home/dev/Documents/v0-fruit-reception-system/scripts/10-add-quality-cafe-table.sql` (functionality replaced)
- `calidad_cafe` table and all its policies

## Rollback Plan

If issues occur, you can rollback by:

1. **Restore from backup**: Use database backup before migration
2. **Manual rollback steps**:
   ```sql
   -- Recreate calidad_cafe table (from old script)
   -- Copy data back from quality_evaluations
   -- Revert code changes
   -- Redeploy
   ```

## Future Enhancements

Potential improvements:
1. Add more quality metrics (size, color, etc.)
2. Support different threshold sets per region
3. Batch discount application tool
4. Quality trend analysis across time
5. Automated quality alerts

## Support

For issues or questions:
1. Check server logs for errors
2. Verify database migration completed
3. Ensure code changes are deployed
4. Check RLS policies are correct
5. Validate user has admin permissions

## Notes

- The `discount_thresholds` table must have entries for all quality metrics you want to support
- Discounts are applied in real-time via triggers
- The system is backward compatible with existing reception data
- All existing quality evaluations have been migrated
