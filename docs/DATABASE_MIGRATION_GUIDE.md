# Database Migration Guide - Pricing System

**Date:** October 31, 2025

---

## 🚨 Critical: Database Migration Required

The pricing system requires database migrations to be applied before it can function properly. The error you're seeing is because the `pricing_calculations` table and foreign key relationships don't exist yet.

---

## 📋 Error Details

**Console Error:**
```
Error fetching receptions: {
  code: 'PGRST200',
  details: "Could not find a relationship between 'receptions' and 'pricing_calculations' in the schema cache",
  message: "Could not find a relationship between 'receptions' and 'pricing_calculations' in the schema cache"
}
```

**Root Cause:**
- The `receptions` table is missing the `pricing_calculation_id` foreign key column
- The `pricing_calculations` table doesn't exist
- The `pricing_rules` and `discount_thresholds` tables don't exist

---

## 🔧 Solution: Apply Database Migrations

### Migration Files

1. **`scripts/12-add-quality-pricing-system.sql`** - Creates core pricing tables
2. **`scripts/13-add-pricing-to-receptions.sql`** - Links receptions to pricing

---

## 📝 How to Apply Migrations

### Option 1: Using PostgreSQL CLI (psql)

```bash
# Apply migration 12: Create pricing tables
psql -d your_database_name -f scripts/12-add-quality-pricing-system.sql

# Apply migration 13: Add reception integration
psql -d your_database_name -f scripts/13-add-pricing-to-receptions.sql
```

**Example:**
```bash
psql -d fruit_reception_db -f scripts/12-add-quality-pricing-system.sql
psql -d fruit_reception_db -f scripts/13-add-pricing-to-receptions.sql
```

---

### Option 2: Using Supabase CLI

If you're using Supabase locally:

```bash
# Reset database (applies all migrations)
supabase db reset

# OR apply specific migrations
supabase migration up
```

---

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Run the SQL in order (12 first, then 13)

---

### Option 4: Direct SQL Execution

Execute these SQL commands directly in your database:

```sql
-- Execute scripts/12-add-quality-pricing-system.sql content here
-- Then execute scripts/13-add-pricing-to-receptions.sql content here
```

**Full migration files available at:**
- `/scripts/12-add-quality-pricing-system.sql`
- `/scripts/13-add-pricing-to-receptions.sql`

---

## ✅ Verification

After applying migrations, verify with:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pricing_rules', 'discount_thresholds', 'pricing_calculations');

-- Check FK column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'receptions'
AND column_name = 'pricing_calculation_id';
```

Expected output:
- `pricing_rules` ✓
- `discount_thresholds` ✓
- `pricing_calculations` ✓
- `pricing_calculation_id` ✓

---

## 🔄 Post-Migration Steps

### 1. Clear Next.js Cache

```bash
# Stop the dev server (Ctrl+C)
# Then run:
rm -rf .next
npm run dev
```

### 2. Re-enable Pricing Queries

After migration is applied, uncomment the TODO sections in:

**File:** `lib/actions/reception.ts`
```typescript
// Line 19: Uncomment this line:
pricing_calculations(id)
```

**File:** `lib/actions/reception.ts`
```typescript
// Line 64: Uncomment this line:
pricing_calculations(id)
```

**File:** `app/api/pricing/history/route.ts`
```typescript
// Line 16: Uncomment the pricing_calculations fields
pricing_calculations(id, base_price_per_kg, total_weight, gross_value, total_discount_amount, final_total, created_at, calculation_data)
```

### 3. Verify Functionality

1. Navigate to `/dashboard/reception` - should load without errors
2. Navigate to `/dashboard/pricing` - should display pricing configuration
3. Create a test reception - pricing should calculate automatically

---

## 📊 What Migrations Create

### Migration 12: Core Pricing Tables

1. **`pricing_rules`**
   - Configuration for quality-based pricing per fruit type
   - Fields: `id`, `fruit_type`, `quality_based_pricing_enabled`, `created_at`, etc.

2. **`discount_thresholds`**
   - Discount ranges for quality metrics
   - Fields: `id`, `pricing_rule_id`, `quality_metric`, `min_value`, `max_value`, `discount_percentage`, etc.

3. **`pricing_calculations`**
   - Immutable pricing calculations for each reception
   - Fields: `id`, `reception_id`, `base_price_per_kg`, `total_weight`, `gross_value`, `total_discount_amount`, `final_total`, `calculation_data`, etc.

### Migration 13: Integration

1. **Foreign Key**
   - Adds `pricing_calculation_id` to `receptions` table
   - Creates FK relationship to `pricing_calculations`

2. **RLS Policies**
   - Secures pricing tables with Row Level Security
   - Admin-only write access
   - Authenticated read access

3. **Initial Data**
   - Seeds default pricing rules (disabled by default)
   - Creates rules for all fruit types: CAFÉ, CACAO, MIEL, COCOS

---

## 🆘 Troubleshooting

### Error: "relation does not exist"

**Solution:** Ensure migrations are applied in order (12 first, then 13)

### Error: "column pricing_calculation_id does not exist"

**Solution:** Check that migration 13 was applied successfully

### Error: "Could not find a relationship"

**Solution:** Clear Next.js cache: `rm -rf .next && npm run dev`

### Still getting errors after migration?

1. Restart the dev server
2. Check database connection in `.env.local`
3. Verify migrations in Supabase dashboard → Database → Migrations

---

## 📞 Support

If you continue to experience issues:

1. Check the migration files exist: `ls -la scripts/12*.sql scripts/13*.sql`
2. Verify database connection
3. Check Supabase logs: Dashboard → Logs
4. Review error logs: `cat /tmp/dev-server.log`

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Apply migrations | `psql -d dbname -f scripts/12-add-quality-pricing-system.sql && psql -d dbname -f scripts/13-add-pricing-to-receptions.sql` |
| Reset Supabase | `supabase db reset` |
| Clear cache | `rm -rf .next` |
| Start dev server | `npm run dev` |

---

**Status:** 🔴 Migration Required
**Next Step:** Apply database migrations using one of the methods above
