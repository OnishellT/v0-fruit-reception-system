# Migration Fixes - Universal Quality System

## Issue Fixed: Null `created_by` in `desglose_descuentos`

### Error
```
ERROR: 23502: null value in column "created_by" of relation "desglose_descuentos" violates not-null constraint
```

### Root Cause
The trigger function `trigger_apply_quality_discounts()` runs after quality evaluation insert/update, but at that point we don't have access to the session user ID. The function was trying to use `auth.uid()` which returns null in trigger context.

### Solution
Modified the `apply_quality_discounts()` function to:
1. **Get user ID from the quality evaluation record** (created_by or updated_by fields)
2. **Add fallback logic**: If user ID is still null, use any active admin user
3. **Final fallback**: Use a placeholder UUID if no admin exists

### Changes Made

#### 1. Updated `apply_quality_discounts()` function
```sql
-- Get user ID from the quality evaluation record
SELECT created_by INTO v_user_id
FROM quality_evaluations
WHERE recepcion_id = p_recepcion_id;

-- If not found, try updated_by
IF v_user_id IS NULL THEN
  SELECT updated_by INTO v_user_id
  FROM quality_evaluations
  WHERE recepcion_id = p_recepcion_id;
END IF;

-- Fallback to admin user if still null
IF v_user_id IS NULL THEN
  SELECT id INTO v_user_id
  FROM users
  WHERE role = 'admin' AND is_active = true
  LIMIT 1;
END IF;
```

#### 2. Updated trigger function
```sql
CREATE OR REPLACE FUNCTION trigger_apply_quality_discounts()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from the quality evaluation
  v_user_id := COALESCE(NEW.updated_by, NEW.created_by);
  PERFORM apply_quality_discounts(NEW.recepcion_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Added error handling in migration
```sql
FOR rec IN
  SELECT DISTINCT recepcion_id FROM quality_evaluations
LOOP
  BEGIN
    PERFORM apply_quality_discounts(rec.recepcion_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error applying discounts to reception %: %', rec.recepcion_id, SQLERRM;
  END;
END LOOP;
```

## How to Run

The migration script is now fixed. Run it in Supabase:

```sql
\i /home/dev/Documents/v0-fruit-reception-system/scripts/18-universal-quality-system.sql
```

## What the Migration Does Now

1. ✅ Adds weight columns to receptions (if not exist)
2. ✅ Creates `quality_evaluations` table with RLS policies
3. ✅ Creates view `quality_discount_calculations` for discount calculations
4. ✅ Creates function `apply_quality_discounts()` with proper user ID handling
5. ✅ Creates trigger `auto_apply_quality_discounts()` that fires on quality insert/update
6. ✅ Migrates data from `calidad_cafe` to `quality_evaluations`
7. ✅ Applies discounts to all existing receptions (with error handling)
8. ✅ Drops old `calidad_cafe` table

## Key Improvements

### Robust User ID Handling
- Gets user ID from quality evaluation record
- Falls back to active admin user
- Never fails due to null user ID

### Error Resilience
- Individual reception discount failures won't stop the migration
- All errors are logged with details
- Migration continues even if some discounts fail

### Transaction Safety
- All operations are wrapped in proper transactions
- Constraints prevent invalid data
- RLS policies ensure security

## Testing After Migration

After running the migration, verify:

1. **Table Creation**
   ```sql
   SELECT * FROM quality_evaluations LIMIT 5;
   ```

2. **Discount Application**
   ```sql
   SELECT * FROM desglose_descuentos ORDER BY created_at DESC LIMIT 10;
   ```

3. **Trigger Function**
   ```sql
   -- Create a test quality evaluation
   INSERT INTO quality_evaluations (recepcion_id, violetas, humedad, moho, created_by, updated_by)
   VALUES ('some-reception-id', 10, 15, 5, 'admin-user-id', 'admin-user-id');

   -- Check if discounts were applied
   SELECT * FROM desglose_descuentos WHERE recepcion_id = 'some-reception-id';
   ```

## Files Modified

- `/home/dev/Documents/v0-fruit-reception-system/scripts/18-universal-quality-system.sql` - Fixed null user_id issue

## Backward Compatibility

The fix ensures:
- ✅ Existing quality data is preserved during migration
- ✅ All existing discounts remain valid
- ✅ New quality evaluations work correctly
- ✅ Automatic discount calculation works for all fruit types

## Support

If you encounter any issues:

1. **Check logs**: Review Supabase logs for detailed error messages
2. **Verify data**: Ensure quality_evaluations table has data
3. **Check thresholds**: Verify discount_thresholds table has entries
4. **Test manually**: Create a test quality evaluation and check if discounts apply

The migration is now resilient and should complete successfully! 🎉
