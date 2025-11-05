# Quick Migration Guide - Universal Quality System

## ✅ Migration Fixed!

The migration script has been updated to fix **THREE critical issues**:

1. **Column Name Error**: Now uses correct column name `total_peso_original` instead of `total_weight`
2. **Null User ID Error**: Now properly gets user ID from quality evaluation record with fallbacks
3. **Audit Trigger Error**: Fixed audit trigger to use correct audit_logs column names (`action`, `old_values`, `new_values`)

The migration is now resilient and includes:
- Automatic column existence checks
- Correct column name references
- Robust user ID handling with fallbacks
- Fixed audit trigger with proper column names
- Error handling for individual reception failures
- Support for both INSERT and UPDATE operations

## 🚀 Deploy in 3 Steps

### Step 1: Run Database Migration

**Option A: If using Supabase**
```bash
# Go to Supabase SQL Editor and run:
\i /home/dev/Documents/v0-fruit-reception-system/scripts/18-universal-quality-system.sql
```

**Option B: If using local PostgreSQL**
```bash
psql -U postgres -d your_database_name -f /home/dev/Documents/v0-fruit-reception-system/scripts/18-universal-quality-system.sql
```

**What this does:**
- ✅ Creates `quality_evaluations` table
- ✅ Migrates data from `calidad_cafe`
- ✅ Removes old `calidad_cafe` table
- ✅ Sets up automatic discount calculation
- ✅ Applies discounts to existing data

### Step 2: Deploy Code

All code changes are already in your repository. Just redeploy:
```bash
npm run build
npm run dev
```

### Step 3: Test

Visit: http://localhost:3000/dashboard/reception

- Click "Calidad" button on ANY fruit type
- Enter quality values (Violetas, Humedad, Moho)
- Save and verify discounts are calculated

## 📋 Files Created

### Database
- `scripts/18-universal-quality-system.sql` - Migration script

### TypeScript Types
- `lib/types/quality-universal.ts` - Universal quality types

### Server Actions
- `lib/actions/quality-universal.ts` - Universal quality actions

### Tests & Docs
- `test-universal-quality.js` - Automated test script
- `UNIVERSAL_QUALITY_SYSTEM.md` - Detailed documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview

## 🔧 Files Modified

### UI Components
- `components/quality-evaluation-modal.tsx` - Uses universal types
- `app/dashboard/reception/receptions-table-client.tsx` - Removed CAFÉ SECO restriction

### Server Actions
- `lib/actions/reception.ts` - Uses quality_evaluations table

## ✨ What Changed

**Before:**
- ❌ Only CAFÉ SECO had quality evaluation
- ❌ Used `calidad_cafe` table
- ❌ Manual discount calculation
- ❌ No automatic triggers

**After:**
- ✅ ALL fruit types support quality evaluation
- ✅ Uses `quality_evaluations` table
- ✅ Automatic discount calculation via triggers
- ✅ Based on `discount_thresholds` configuration
- ✅ Results stored in `desglose_descuentos`

## 🎯 Quick Test

1. **Create quality for CAFÉ**
   - Go to Receptions
   - Click "Calidad" on any CAFÉ reception
   - Enter values: Violetas=10, Humedad=15, Moho=5
   - Save → Should calculate discounts automatically

2. **Create quality for CACAO**
   - Click "Calidad" on any CACAO reception
   - Enter same values
   - Save → Should calculate discounts automatically

3. **Create quality for MIEL/COCOS**
   - Same process!
   - Quality evaluation now works for ALL fruit types

## 📊 Expected Behavior

### Discount Calculation
For each quality metric:
1. Get actual value (e.g., Violetas = 10%)
2. Find matching threshold in `discount_thresholds`
3. Calculate weight discount: `total_weight × (discount_percentage / 100)`
4. Store in `desglose_descuentos`
5. Update reception totals

### UI Updates
- Quality button visible for ALL fruit types
- Modal title shows specific fruit type
- No "CAFÉ SECO only" restrictions

## 🐛 If Something Goes Wrong

**Error: column r.total_weight does not exist**
→ ✅ **FIXED** - Migration now checks for correct column names

**Error: null value in column "created_by"**
→ ✅ **FIXED** - Migration now properly handles user ID with fallbacks

**Error: column "operation" of relation "audit_logs" does not exist**
→ ✅ **FIXED** - Audit trigger now uses correct column names (action, old_values, new_values)

**Error: Table doesn't exist**
→ Run migration script (Step 1)

**Error: Permission denied**
→ Check RLS policies are created
→ Verify user is admin

**Error: Discounts not calculated**
→ Check `discount_thresholds` has data
→ Verify trigger exists: `auto_apply_quality_discounts`

**Quality button not visible**
→ Clear browser cache
→ Verify user has admin role
→ Check code is deployed

## 📞 Need Help?

Check these files for detailed info:
- `UNIVERSAL_QUALITY_SYSTEM.md` - Full technical details
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `test-universal-quality.js` - Automated test script

## ✅ Success Indicators

After successful deployment:
- [ ] `quality_evaluations` table exists
- [ ] `calidad_cafe` table removed
- [ ] Quality button visible for CACAO, MIEL, COCOS
- [ ] Discounts calculated automatically
- [ ] `desglose_descuentos` populated with discount data

---

**That's it!** Your quality discount system now works for all fruit types! 🎉
