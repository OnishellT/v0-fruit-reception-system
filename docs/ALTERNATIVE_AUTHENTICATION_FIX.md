# ✅ Authentication Fix - Pricing System (Alternative Solution)

**Date:** October 31, 2025
**Status:** RESOLVED

---

## 🚨 Issue
**Error:** "no autorizado" when trying to enable/disable price rules

## 🔍 Root Cause Analysis

The authentication system uses a custom `user_session` cookie (not Supabase Auth), but the initial attempted fix tried to use `createAuthenticatedClient()` which requires Supabase Auth cookies (`sb-access-token`, `sb-refresh-token`).

### The Real Issue
1. **Custom Session System**: The app uses a custom cookie-based session (`user_session`), not Supabase Auth
2. **RLS Policy Mismatch**: RLS policies check `auth.uid()` which requires Supabase Auth JWT tokens
3. **Session Context**: The custom session works with `getSession()` but not with Supabase's `createClient()`

---

## ✅ Solution Applied

**Approach:** Use Service Role Client with Manual Permission Checks

Instead of relying on RLS policies and Supabase Auth, we:
1. Use `createServiceRoleClient()` for database access
2. Manually check user permissions using `getSession()`
3. Verify the user has admin role before allowing operations

### Files Modified

**File:** `/lib/actions/pricing.ts`

#### 1. Import Cleanup
```typescript
// Before:
import { createServiceRoleClient, createClient as createAuthenticatedClient } from "@/lib/supabase/server";

// After:
import { createServiceRoleClient } from "@/lib/supabase/server";
```

#### 2. updatePricingRules() Function
```typescript
export async function updatePricingRules(
  data: UpdatePricingRuleData
): Promise<PricingRuleResponse> {
  try {
    // 1. Validate input
    const validation = UpdatePricingRuleSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: `Datos inválidos: ${validation.error.message}` };
    }

    // 2. Get session from custom cookie
    const session = await getSession();
    if (!session) {
      return { success: false, error: "No autorizado" };
    }

    // 3. Use service role client
    const supabase = await createServiceRoleClient();

    // 4. Manually check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", session.id)
      .single();

    if (userError || !user || user.role !== 'admin' || !user.is_active) {
      return { success: false, error: "No tiene permisos de administrador" };
    }

    // 5. Update pricing rule (bypasses RLS with service role)
    const { data: updatedRule, error } = await supabase
      .from("pricing_rules")
      .update({
        quality_based_pricing_enabled: data.quality_based_pricing_enabled,
        updated_by: session.id,
        updated_at: new Date().toISOString()
      })
      .eq("fruit_type", data.fruit_type)
      .select()
      .single();

    // 6. Log the change
    await supabase
      .from("pricing_changes")
      .insert({
        pricing_rule_id: updatedRule.id,
        change_type: "update",
        changed_by: session.id,
        changes: { quality_based_pricing_enabled: data.quality_based_pricing_enabled }
      });

    // 7. Revalidate
    revalidatePath("/dashboard/pricing");

    return { success: true, data: updatedRule };
  } catch (error) {
    return { success: false, error: "Error inesperado al actualizar las reglas de precios" };
  }
}
```

#### 3. Other Functions Updated
Similarly updated:
- ✅ `createDiscountThreshold()` - Create new thresholds
- ✅ `updateDiscountThreshold()` - Update existing thresholds
- ✅ `deleteDiscountThreshold()` - Delete thresholds

All functions now follow the same pattern:
1. Get session from custom cookie
2. Verify user is admin
3. Use service role client for database operations

---

## 🎯 How It Works Now

### Before Fix (Broken):
```
User clicks toggle in browser
  → Frontend makes fetch request
  → API route calls updatePricingRules()
  → Tries to use createAuthenticatedClient()
  → createClient() can't read custom user_session cookie
  → No session = "No autorizado" error ❌
```

### After Fix (Working):
```
User clicks toggle in browser
  → Frontend makes fetch request with credentials: "include"
  → API route calls updatePricingRules()
  → getSession() reads custom user_session cookie ✓
  → User authenticated, check admin role ✓
  → createServiceRoleClient() bypasses RLS
  → Manual permission check passes ✓
  → Pricing rule updates successfully! ✅
```

---

## 🔐 Security Model

The solution maintains security through:

1. **Session Validation**: Every request validates the custom session
2. **Role-Based Access Control**: Admin role required for all pricing modifications
3. **Audit Trail**: All changes logged to `pricing_changes` table
4. **Service Role Scope**: Only specific functions use service role, with explicit permission checks

---

## 🧪 Test Results

**Manual Test:**
1. Login as admin
2. Go to `/dashboard/pricing`
3. Click "Reglas de Precios" tab
4. Toggle the switch for CAFÉ
5. ✅ Shows success: "Precios basados en calidad habilitados para CAFÉ"

**Automated Test:**
- ✅ All authentication tests pass
- ✅ All dashboard route tests pass
- ✅ Pricing toggle works (PATCH returns 200)

---

## 📊 Files Modified

| File | Change |
|------|--------|
| `/lib/actions/pricing.ts` | Use service role client + manual permission checks for all pricing functions |

---

## 🎉 Result

**Before Fix:**
- ❌ "No autorizado" error on every pricing toggle
- ❌ Cannot enable/disable pricing rules
- ❌ Cannot configure thresholds

**After Fix:**
- ✅ Pricing rules toggle successfully (200 OK)
- ✅ Can configure thresholds
- ✅ Full pricing functionality operational
- ✅ Proper authentication and authorization

---

## 📚 Summary

The fix involved switching from Supabase Auth-based RLS policies to a manual permission checking system that works with the custom session cookie. This approach:

1. ✅ Respects the existing custom authentication system
2. ✅ Maintains security through explicit permission checks
3. ✅ Provides audit logging for all changes
4. ✅ Works with the current frontend architecture

The pricing system is now fully functional with proper authentication!

---

**Status:** ✅ **COMPLETE AND TESTED**
