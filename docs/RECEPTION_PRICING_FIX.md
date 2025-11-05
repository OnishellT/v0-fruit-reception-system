# ✅ Reception Pricing Error Fix

**Date:** October 31, 2025
**Status:** RESOLVED

---

## 🚨 Issue
**Console Error:** "Error fetching reception pricing: {}" appearing on reception detail pages

**Error Code:** PGRST116 - "Cannot coerce the result to a single JSON object"

---

## 🔍 Root Cause

The `getReceptionPricing()` function in `/lib/actions/reception-with-pricing.ts` was using `.single()` to query the `pricing_calculations` table. This method expects exactly 1 row, but fails when:
- A reception doesn't have a pricing calculation yet
- Quality-based pricing is disabled for that fruit type
- No pricing calculation has been performed

When `.single()` finds 0 rows, it throws error PGRST116.

---

## ✅ Solution Applied

Changed from `.single()` to `.maybeSingle()` and improved error handling:

### Before (Broken):
```typescript
export async function getReceptionPricing(receptionId: string) {
  const supabase = await createServiceRoleClient();

  const { data: pricingCalculation, error } = await supabase
    .from("pricing_calculations")
    .select("*")
    .eq("reception_id", receptionId)
    .single();  // ← FAILS when 0 rows found

  if (error) {
    console.error("Error fetching reception pricing:", error);
    return { error: "No se encontró el cálculo de precios" };
  }

  return { success: true, data: pricingCalculation };
}
```

### After (Fixed):
```typescript
export async function getReceptionPricing(receptionId: string) {
  const supabase = await createServiceRoleClient();

  // Use .maybeSingle() instead of .single() to handle cases where no calculation exists
  const { data: pricingCalculation, error } = await supabase
    .from("pricing_calculations")
    .select("*")
    .eq("reception_id", receptionId)
    .maybeSingle();  // ← Returns null if 0 rows, doesn't throw

  // Handle errors (but not "no rows" which is valid)
  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching reception pricing:", error);
    return { error: "Error al obtener el cálculo de precios" };
  }

  // If no pricing calculation exists, return null data (not an error)
  if (!pricingCalculation) {
    return { success: true, data: null, message: "No hay cálculo de precios para esta recepción" };
  }

  return { success: true, data: pricingCalculation };
}
```

---

## 🎯 Key Changes

1. **`.maybeSingle()` instead of `.single()`**
   - `.maybeSingle()` returns `null` if no rows found
   - `.single()` throws an error if no rows found

2. **Selective Error Handling**
   - Only log errors that aren't PGRST116
   - PGRST116 "no rows" is a valid case, not an error

3. **Graceful Null Handling**
   - Return `{ success: true, data: null }` instead of error
   - Page component already handles null pricing calculation

---

## 🧪 Test Results

**Before Fix:**
```
Error fetching reception pricing: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  message: 'Cannot coerce the result to a single JSON object'
}
```

**After Fix:**
- ✅ No console errors
- ✅ Reception detail pages load successfully (200 OK)
- ✅ Pricing breakdown shows only when calculation exists
- ✅ All tests pass

---

## 📄 Files Modified

| File | Change |
|------|--------|
| `/lib/actions/reception-with-pricing.ts` | Fixed `getReceptionPricing()` to use `.maybeSingle()` and handle null cases |

---

## 🎉 Result

**Before Fix:**
- ❌ Console error on reception pages without pricing
- ❌ Confusing error message for users
- ❌ Unnecessary error logging

**After Fix:**
- ✅ Clean console (no errors)
- ✅ Graceful handling of missing pricing
- ✅ Pages load correctly
- ✅ Pricing breakdown shows conditionally

The reception detail pages now work correctly whether or not a pricing calculation exists!

---

**Status:** ✅ **COMPLETE AND TESTED**
