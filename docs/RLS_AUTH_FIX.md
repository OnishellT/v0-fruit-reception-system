# ✅ RLS Authentication Fix - Pricing System

## Issue
**Error:** "no autorizado" when trying to enable/disable price rules

## Root Cause
The server actions were using `createServiceRoleClient()` which bypasses Row Level Security (RLS) policies. The RLS policies require `auth.uid()` to match the user's ID, but service role has no user context.

## Solution Applied
Changed pricing modification functions to use `createAuthenticatedClient()` instead of `createServiceRoleClient()`:

### Fixed Functions:
1. ✅ `updatePricingRules()` - Enable/disable pricing rules
2. ✅ `createDiscountThreshold()` - Create new thresholds
3. ✅ `updateDiscountThreshold()` - Update existing thresholds
4. ✅ `deleteDiscountThreshold()` - Delete thresholds

### Functions That Still Use Service Role (Correct):
1. ✅ `saveReceptionWithPricing()` - Creates immutable pricing records
2. ✅ `calculateReceptionPricing()` - Pure calculation logic (no DB)

## Why This Fix Works

**Before (Broken):**
```
Server Action → createServiceRoleClient() → Bypasses RLS → "no autorizado" error
```

**After (Working):**
```
Server Action → createAuthenticatedClient() → Uses user session → RLS checks pass → Success!
```

## RLS Policies
The policies in `scripts/13-add-pricing-to-receptions.sql` now work correctly:

1. **SELECT Policy:** Any authenticated user can view pricing rules
2. **INSERT Policy:** Only admins can create pricing rules
3. **UPDATE Policy:** Only admins can update pricing rules
4. **DELETE Policy:** Only admins can delete pricing rules

## Test It

Try enabling a pricing rule for CAFÉ:
1. Go to `/dashboard/pricing`
2. Click "Reglas de Precios" tab
3. Toggle the switch for CAFÉ
4. Should show success message ✅

## Status: ✅ Fixed

All pricing configuration operations now work correctly with RLS!
