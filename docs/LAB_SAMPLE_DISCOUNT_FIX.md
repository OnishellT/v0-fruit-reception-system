# LAB SAMPLE QUALITY DISCOUNTS - ISSUE FIXED ✅

## Problem Summary

**Issue**: Lab sample quality discounts were not appearing in the reception details page, even though the discount calculation logic was in place.

**Root Cause**: The trigger `auto_apply_quality_discounts` was only set on the `quality_evaluations` table (for reception-level quality), but NOT on the `laboratory_samples` table. This meant when lab samples were updated with quality results, the discounts were never calculated.

## Solution Implemented

### Migration 36: Add Trigger for Laboratory Samples

**File**: `scripts/36-add-lab-sample-trigger.sql`

**What was added:**

1. **New Trigger Function**: `trigger_lab_sample_quality_update()`
   - Fires when lab samples are INSERTED or UPDATED
   - Only triggers when quality metrics change (violetas_percentage, moho_percentage, basura_percentage, dried_sample_kg)
   - Calls `apply_quality_discounts()` to calculate discounts

2. **New Trigger**: `auto_apply_quality_discounts_lab_samples`
   - Attached to `laboratory_samples` table
   - Calls `trigger_lab_sample_quality_update()` function

3. **Bonus Trigger**: `auto_apply_quality_discounts_receptions`
   - Attached to `receptions` table
   - Fires when lab sample weights change (lab_sample_wet_weight, lab_sample_dried_weight)
   - Ensures discounts are recalculated when lab weights are updated

## How It Works

### Before Fix:
```
Lab Sample Updated → ❌ NO TRIGGER → Discounts NOT calculated
```

### After Fix:
```
Lab Sample Updated → Trigger Fires → apply_quality_discounts() called
    ↓
Calculates discounts based on:
  - Lab Violetas % → Discount %
  - Lab Moho % → Discount %
  - Lab Basura % → Discount %
    ↓
Inserts records into desglose_descuentos table:
  - "Violetas (Muestra Lab)"
  - "Moho (Muestra Lab)"
  - "Basura (Muestra Lab)"
    ↓
Updates reception:
  - total_peso_descuento (increases)
  - total_peso_final (decreases)
    ↓
Display in reception details page ✅
```

## Discount Display in Reception Details

When you view a reception details page, you should now see:

### Section: "Desglose de Descuentos por Calidad"

```
┌─────────────────────────────────────────────────────────┐
│ 🔻 Desglose de Descuentos por Calidad                   │
├─────────────────────────────────────────────────────────┤
│ Violetas (Evaluación)                                  │
│ Valor: 8.0% | Umbral: 5.0% | Descuento: 2.0%          │
│                                           -16.40 kg    │
│                                                         │
│ Humedad (Evaluación)                                    │
│ Valor: 12.0% | Umbral: 10.0% | Descuento: 2.0%        │
│                                           -16.40 kg    │
│                                                         │
│ Moho (Evaluación)                                       │
│ Valor: 3.0% | Umbral: 2.0% | Descuento: 3.0%          │
│                                           -24.60 kg    │
│                                                         │
│ Violetas (Muestra Lab)                                  │
│ Valor: 33.0% | Umbral: 10.0% | Descuento: 5.0%        │
│                                           -41.00 kg    │
│                                                         │
│ Moho (Muestra Lab)                                      │
│ Valor: 33.0% | Umbral: 5.0% | Descuento: 10.0%        │
│                                           -82.00 kg    │
│                                                         │
│ Basura (Muestra Lab)                                    │
│ Valor: 33.0% | Umbral: 10.0% | Descuento: 5.0%        │
│                                           -41.00 kg    │
├─────────────────────────────────────────────────────────┤
│ Total Descontado:                            -221.40 kg │
└─────────────────────────────────────────────────────────┘
```

## Testing Instructions

### 1. Apply Migration 36 (if not already applied)

```bash
# Apply the migration
psql -d $DATABASE_URL -f scripts/36-add-lab-sample-trigger.sql
```

### 2. Run the Test Script

```bash
# Run the verification script
./test-lab-sample-discounts.sh
```

### 3. Manual Testing Steps

1. **Create a Reception**
   - Go to Dashboard → New Reception
   - Select fruit type: CACAO (Verde)
   - Add details and save

2. **Create Lab Sample**
   - From reception details, create lab sample
   - Enter sample weight (e.g., 5 kg)

3. **Update Lab Sample with Quality Results**
   - Enter dried sample weight (e.g., 3.5 kg)
   - Enter quality metrics:
     - Violetas: 33%
     - Moho: 33%
     - Basura: 33%

4. **View Reception Details**
   - Look for "Desglose de Descuentos por Calidad" section
   - Verify lab sample discounts appear:
     - ✅ "Violetas (Muestra Lab)"
     - ✅ "Moho (Muestra Lab)"
     - ✅ "Basura (Muestra Lab)"

## Expected Behavior

### Lab Sample Quality Discount Calculation

The system calculates discounts based on the following thresholds (adjustable in pricing rules):

| Metric | Threshold | Discount % | Weight Applied To |
|--------|-----------|------------|-------------------|
| Violetas | > 10% | 5% | Total Reception Weight |
| Moho | > 5% | 10% | Total Reception Weight |
| Basura | > 10% | 5% | Total Reception Weight |

### Formula

```
Total Quality Discount = 
  (Reception-level Violetas % × Weight) +
  (Reception-level Humedad % × Weight) +
  (Reception-level Moho % × Weight) +
  (Lab Sample Violetas % × Weight) +  ← NEW!
  (Lab Sample Moho % × Weight) +       ← NEW!
  (Lab Sample Basura % × Weight)       ← NEW!

Final Weight = Original Weight - Total Quality Discount + Lab Adjustment
```

## Files Modified

1. **Created**: `scripts/36-add-lab-sample-trigger.sql` (NEW MIGRATION)
2. **Created**: `test-lab-sample-discounts.sh` (TEST SCRIPT)

## Verification Checklist

- [ ] Migration 36 applied successfully
- [ ] Trigger exists on laboratory_samples table
- [ ] Trigger exists on receptions table
- [ ] Lab sample quality discounts appear in breakdown
- [ ] Discount percentages are calculated correctly
- [ ] Total weight is updated correctly

## Notes

- Lab sample discounts STACK with reception-level quality discounts
- Both types are added together for total discount
- The trigger is smart: it only fires when quality metrics actually change
- The system properly handles the calculation chain:
  1. Quality metrics entered
  2. Trigger fires
  3. Discounts calculated
  4. Database updated
  5. UI displays results

## Support

If you encounter issues:

1. Check that migration 36 was applied
2. Verify triggers exist in database:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname LIKE '%auto_apply_quality_discounts%';
   ```
3. Check trigger logs in database
4. Run the test script for diagnostics

---

**Status**: ✅ READY FOR TESTING

**Date**: 2025-11-02
