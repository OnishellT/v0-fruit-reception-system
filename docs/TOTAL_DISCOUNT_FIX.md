# 🔧 TOTAL DISCOUNT CALCULATION FIX - Migration 37

## Problem
The lab sample quality discounts were appearing in the breakdown table ✅, but the **total discount** shown in the weight summary didn't match what it should be based on those discounts ❌.

## Root Cause
The receptions table fields (`total_peso_descuento`, `total_peso_final`) were not being updated correctly by the trigger, even though the breakdown in `desglose_descuentos` was correct.

## Solution - Migration 37

### What's Fixed

**1. New Function: `recalculate_reception_totals(UUID)`**
- Calculates total discount from breakdown
- Updates `total_peso_descuento` and `total_peso_final` on receptions table
- Ensures database matches the breakdown

**2. Enhanced Trigger**
- Updated to call recalculation function after discounts are applied
- Guarantees totals are always in sync

**3. Manual Recalculation Function**
- `manual_recalculate_discounts(UUID)` - for debugging
- Returns JSON with all totals and counts

**4. Debug View**
- `reception_totals_with_discounts` view
- Shows which receptions have mismatched totals

**5. Enhanced API Function**
- Updated `getDiscountBreakdown()` in `lib/actions/pricing.ts`
- Calculates totals from breakdown
- Compares with database
- Auto-recalculates if mismatch detected
- Returns debug information

## How to Deploy

### Step 1: Apply Migration 37
```bash
psql -d $DATABASE_URL -f scripts/37-fix-total-discount-calculation.sql
```

### Step 2: Verify Triggers
```bash
psql -d $DATABASE_URL -c "SELECT tgname FROM pg_trigger WHERE tgname LIKE '%auto_apply_quality_discounts%';"
```

Should show:
- `auto_apply_quality_discounts`
- `auto_apply_quality_discounts_lab_samples`
- `auto_apply_quality_discounts_receptions`

### Step 3: Test

**Manual Test:**
```sql
-- Check a reception's totals
SELECT * FROM reception_totals_with_discounts WHERE id = 'YOUR_RECEPTION_ID';

-- Manually recalculate if needed
SELECT manual_recalculate_discounts('YOUR_RECEPTION_ID');
```

**UI Test:**
1. Create/update lab sample with quality results
2. View reception details
3. Check "Desglose de Descuentos por Calidad" table ✅ (shows breakdown)
4. Check "Resumen" card - **total discount should match breakdown** ✅

## Expected Results

### Before Fix
```
Breakdown Table:
  Violetas (Muestra Lab): -41.00 kg ✅
  Moho (Muestra Lab): -82.00 kg ✅
  Basura (Muestra Lab): -41.00 kg ✅
  Total in breakdown: -164.00 kg ✅

Summary Card:
  Descuento por Calidad: -100.00 kg ❌ (WRONG!)
  Peso Final: 656.00 kg ❌ (WRONG!)
```

### After Fix
```
Breakdown Table:
  Violetas (Muestra Lab): -41.00 kg ✅
  Moho (Muestra Lab): -82.00 kg ✅
  Basura (Muestra Lab): -41.00 kg ✅
  Total in breakdown: -164.00 kg ✅

Summary Card:
  Descuento por Calidad: -164.00 kg ✅ (CORRECT!)
  Peso Final: 532.00 kg ✅ (CORRECT!)
```

## Verification Queries

### Check All Receptions for Mismatches
```sql
SELECT 
  id,
  total_peso_original,
  total_peso_descuento,
  calculated_total_discount,
  discount_status
FROM reception_totals_with_discounts
WHERE discount_status = 'MISMATCH';
```

### Get Detailed Breakdown for a Reception
```sql
SELECT 
  parametro,
  valor,
  porcentaje_descuento,
  peso_descuento
FROM desglose_descuentos
WHERE recepcion_id = 'YOUR_RECEPTION_ID'
ORDER BY parametro;
```

### Check Lab Sample Data
```sql
SELECT 
  id,
  violetas_percentage,
  moho_percentage,
  basura_percentage,
  dried_sample_kg,
  status
FROM laboratory_samples
WHERE reception_id = 'YOUR_RECEPTION_ID';
```

## What the Fix Does

### The Flow
```
1. Lab Sample Updated → Trigger Fires
        ↓
2. apply_quality_discounts() calculates individual discounts
        ↓
3. Inserts records into desglose_descuentos table
        ↓
4. recalculate_reception_totals() sums up all discounts
        ↓
5. Updates receptions table: total_peso_descuento, total_peso_final
        ↓
6. UI displays matching totals ✅
```

### API Enhancement
The `getDiscountBreakdown()` function now:
1. Fetches breakdown from database
2. Calculates total from breakdown
3. Compares with stored values
4. If mismatch → auto-recalculates
5. Returns correct values + debug info

## Files Created

- `scripts/37-fix-total-discount-calculation.sql` - Main migration
- Updated `lib/actions/pricing.ts` - Enhanced discount breakdown function

## Testing Checklist

- [ ] Apply migration 37
- [ ] Create/update lab sample with quality results
- [ ] View reception details
- [ ] Verify breakdown shows lab sample discounts
- [ ] Verify total discount in summary matches breakdown
- [ ] Verify final weight calculation is correct
- [ ] Check browser console for debug info

## Console Debug Output

When there's a mismatch, you'll see in the browser console:
```
⚠️ Discount totals mismatch detected! {
  receptionId: "...",
  dbTotalDiscount: 100.00,
  breakdownTotal: 164.00,
  dbFinalWeight: 656.00,
  expectedFinalWeight: 532.00
}
✅ Successfully recalculated totals
```

## Success Criteria

✅ Lab sample discounts appear in breakdown table
✅ Total discount in summary matches breakdown total
✅ Final weight calculation is correct
✅ No console warnings about mismatches
✅ All test queries return "MATCH" status

---

**Status:** READY FOR DEPLOYMENT ✅
