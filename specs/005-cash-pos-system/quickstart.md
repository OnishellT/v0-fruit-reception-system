# Quickstart Guide: Cash POS Reception System

**Date**: 2025-11-05
**Feature**: Cash Point-of-Sale Reception System
**Branch**: `005-cash-pos-system`

## Overview

Welcome to the Cash POS Reception System! This guide will help you get up to speed quickly for development.

## What is Cash POS?

Cash POS is an isolated domain for handling same-day cash fruit receptions with:
- **Daily pricing** set by admins
- **Quality-based discounting** using excess-over-threshold calculations
- **Immutable price snapshots** for financial integrity
- **Printable invoices** with detailed discount breakdowns
- **Role-based access control** (Admin, Operator, Viewer)

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes / Server Actions
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Security**: Supabase RLS (Row Level Security)
- **Testing**: Playwright E2E tests

## Project Structure

```
# New directories for Cash POS
app/dashboard/cash-pos/              # Cash POS pages
components/cash-pos/                 # Reusable components
lib/actions/cash/                    # Server actions
lib/db/cash.ts                       # Database schema
lib/supabase/cash.ts                 # RLS policies
drizzle/schema/cash.ts               # Drizzle table definitions
tests/e2e/cash-pos/                  # E2E tests
```

## Key Concepts

### 1. Domain Isolation
All cash tables use `cash_` prefix to ensure complete separation:
- `cash_customers`
- `cash_fruit_types`
- `cash_daily_prices`
- `cash_quality_thresholds`
- `cash_receptions`

**Why?** Prevents data leakage, allows independent evolution

### 2. Price Snapshot Pattern
```typescript
// When creating reception:
const priceSnapshot = await getActivePrice(fruitTypeId, date);
const reception = await createReception({
  pricePerKgSnapshot: priceSnapshot, // IMMUTABLE
  // ... other fields
});

// Later price changes DON'T affect this reception
```

### 3. Discount Calculation
```typescript
// Excess-over-threshold
const humidityExcess = Math.max(0, humidity - 30); // 40% - 30% = 10%
const mohoExcess = Math.max(0, moho - 10);        // 8% - 10% = 0%
const violetasExcess = Math.max(0, violetas - 5);  // 7% - 5% = 2%

const totalExcess = humidityExcess + mohoExcess + violetasExcess; // 12%
const discountWeight = originalWeight * (totalExcess / 100);
const finalWeight = originalWeight - discountWeight;
```

## Development Workflow

### Step 1: Database Setup

**Create migration:**
```bash
# Generate migration from Drizzle schema
drizzle-kit generate:pg --config=drizzle.config.ts

# Run migration
drizzle-kit migrate:pg --config=drizzle.config.ts
```

**Key tables to create (in order):**
1. `cash_fruit_types` (seed with CAFE, CACAO, MIEL, COCOS)
2. `cash_customers`
3. `cash_daily_prices`
4. `cash_quality_thresholds`
5. `cash_receptions`

**Seed initial data:**
```sql
-- Fruit types
INSERT INTO cash_fruit_types (code, name) VALUES
('CAFE', 'Café'), ('CACAO', 'Cacao'), ('MIEL', 'Miel'), ('COCOS', 'Cocos');

-- Default thresholds for Café
INSERT INTO cash_quality_thresholds (fruitTypeId, metric, thresholdPercent) VALUES
(1, 'humedad', 30.00), (1, 'moho', 10.00), (1, 'violetas', 5.00);
```

### Step 2: Configure RLS Policies

**File**: `lib/supabase/cash.ts`

```sql
-- Enable RLS
ALTER TABLE cash_receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_quality_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_fruit_types ENABLE ROW LEVEL SECURITY;

-- Example policies (customize based on your auth system)
CREATE POLICY "cash_customers_select_authenticated"
ON cash_customers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "cash_customers_modify_admin_operator"
ON cash_customers FOR ALL
USING (auth.jwt()->>'role' IN ('admin', 'operator'));

-- Add similar policies for all tables
```

### Step 3: Create Drizzle Schema

**File**: `drizzle/schema/cash.ts`

```typescript
import { pgTable, serial, varchar, numeric, integer, timestamp, boolean, jsonb, date } from "drizzle-orm/pg-core";

export const cashCustomers = pgTable("cash_customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  nationalId: varchar("national_id", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
});

export const cashFruitTypes = pgTable("cash_fruit_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ... continue for all tables
```

### Step 4: Create Server Actions

**File**: `lib/actions/cash/receptions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { computeCashDiscounts } from "@/lib/utils/discounts";

export async function createCashReception(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'operator'].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const fruitTypeId = Number(formData.get('fruitTypeId'));
  const customerId = Number(formData.get('customerId'));
  const totalWeightKg = Number(formData.get('totalWeightKg'));

  // Find active price for today
  const price = await getActivePrice(fruitTypeId, new Date());
  if (!price) {
    throw new Error("No price set for today");
  }

  // Get quality measurements
  const humidity = Number(formData.get('humedad')) || 0;
  const moho = Number(formData.get('moho')) || 0;
  const violetas = Number(formData.get('violetas')) || 0;

  // Calculate discounts
  const thresholds = await getQualityThresholds(fruitTypeId);
  const discountResult = computeCashDiscounts(totalWeightKg, thresholds, {
    humedad: humidity,
    moho: moho,
    violetas: violetas,
  });

  // Create reception with snapshot
  const reception = await db.insert(cashReceptions).values({
    fruitTypeId,
    customerId,
    totalWeightKgOriginal: totalWeightKg,
    pricePerKgSnapshot: price.pricePerKg,
    calidadHumedad: humidity,
    calidadMoho: moho,
    calidadVioletas: violetas,
    discountPercentTotal: discountResult.combinedPercent,
    discountWeightKg: discountResult.discountWeightKg,
    totalWeightKgFinal: discountResult.finalKg,
    grossAmount: totalWeightKg * price.pricePerKg,
    netAmount: discountResult.finalKg * price.pricePerKg,
    discountBreakdown: discountResult.breakdown,
    createdBy: user.id,
  });

  revalidatePath('/dashboard/cash-pos/receptions');
  return reception;
}
```

### Step 5: Build UI Components

**File**: `components/cash-pos/reception-form.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { createCashReception } from "@/lib/actions/cash/receptions";

export function ReceptionForm() {
  const [form, setForm] = useState({
    fruitTypeId: "",
    customerId: "",
    totalWeightKg: "",
    humedad: "",
    moho: "",
    violetas: "",
  });

  const [discount, setDiscount] = useState({
    percent: 0,
    weightKg: 0,
    finalWeight: 0,
    netAmount: 0,
  });

  // Real-time discount calculation
  useEffect(() => {
    const weight = Number(form.totalWeightKg) || 0;
    const humidity = Number(form.humedad) || 0;
    const moho = Number(form.moho) || 0;
    const violetas = Number(form.violetas) || 0;

    const humidityExcess = Math.max(0, humidity - 30);
    const mohoExcess = Math.max(0, moho - 10);
    const violetasExcess = Math.max(0, violetas - 5);

    const totalExcess = Math.min(humidityExcess + mohoExcess + violetasExcess, 100);
    const discountWeight = weight * (totalExcess / 100);
    const finalWeight = weight - discountWeight;

    setDiscount({
      percent: totalExcess,
      weightKg: discountWeight,
      finalWeight: finalWeight,
      netAmount: finalWeight * 95, // TODO: get price
    });
  }, [form]);

  return (
    <form action={createCashReception}>
      {/* Form fields */}
      <input
        type="number"
        name="fruitTypeId"
        value={form.fruitTypeId}
        onChange={(e) => setForm({ ...form, fruitTypeId: e.target.value })}
        required
      />

      {/* Discount preview */}
      <div>
        <p>Discount: {discount.percent.toFixed(2)}%</p>
        <p>Final Weight: {discount.finalWeight.toFixed(3)} kg</p>
      </div>

      <button type="submit">Save Reception</button>
    </form>
  );
}
```

## Core Utilities

### Discount Calculation
**File**: `lib/utils/discounts.ts`

```typescript
export function computeCashDiscounts(
  totalKg: number,
  thresholds: Array<{ metric: string; thresholdPercent: number; enabled: boolean }>,
  quality: Record<string, number | undefined>
) {
  let combinedPercent = 0;
  const breakdown: Record<string, any> = {};

  for (const threshold of thresholds.filter(t => t.enabled)) {
    const value = quality[threshold.metric] ?? 0;
    const excess = Math.max(0, value - threshold.thresholdPercent);
    combinedPercent += excess;

    breakdown[threshold.metric] = {
      threshold: threshold.thresholdPercent,
      value: value || null,
      percentApplied: excess,
      weightKg: 0, // calculated after clamping
    };
  }

  combinedPercent = Math.max(0, Math.min(100, combinedPercent));
  const discountWeightKg = +(totalKg * (combinedPercent / 100)).toFixed(3);
  const finalKg = +(totalKg - discountWeightKg).toFixed(3);

  // Distribute weight proportionally
  const totalExcess = thresholds
    .filter(t => t.enabled)
    .reduce((sum, t) => sum + Math.max(0, (quality[t.metric] ?? 0) - t.thresholdPercent), 0);

  for (const metric of Object.keys(breakdown)) {
    const share = totalExcess > 0 ? breakdown[metric].percentApplied / totalExcess : 0;
    breakdown[metric].weightKg = +(discountWeightKg * share).toFixed(3);
  }

  return {
    combinedPercent,
    discountWeightKg,
    finalKg,
    breakdown,
  };
}
```

### Price Lookup
**File**: `lib/utils/price-lookup.ts`

```typescript
export async function getActivePrice(fruitTypeId: number, date: Date) {
  // Convert date to YYYY-MM-DD format
  const dateStr = date.toISOString().split('T')[0];

  const price = await db.query.cashDailyPrices.findFirst({
    where: (prices, { eq, and }) =>
      and(
        eq(prices.fruitTypeId, fruitTypeId),
        eq(prices.priceDate, dateStr),
        eq(prices.active, true)
      ),
    orderBy: (prices, { desc }) => [desc(prices.createdAt)],
  });

  return price;
}
```

## Testing

### E2E Test Example
**File**: `tests/e2e/cash-pos/create-reception.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('create cash reception with discount', async ({ page }) => {
  await page.goto('/dashboard/cash-pos/receptions/new');

  // Fill form
  await page.selectOption('[name=fruitTypeId]', '1'); // Café
  await page.selectOption('[name=customerId]', '1');
  await page.fill('[name=totalWeightKg]', '200');

  // Enter quality that triggers discount
  await page.fill('[name=humedad]', '40'); // 10% over 30% threshold

  // Verify discount is calculated
  await expect(page.locator('[data-discount-percent]')).toHaveText('10.000%');
  await expect(page.locator('[data-final-weight]')).toHaveText('180.000 kg');

  // Submit
  await page.click('[type=submit]');

  // Verify success
  await expect(page.locator('text=Reception created')).toBeVisible();
});
```

## Common Tasks

### Adding a New Fruit Type
```sql
INSERT INTO cash_fruit_types (code, name) VALUES ('NUEZ', 'Nuez');
INSERT INTO cash_quality_thresholds (fruitTypeId, metric, thresholdPercent) VALUES
  (5, 'humedad', 25.00), (5, 'moho', 15.00), (5, 'violetas', 8.00);
```

### Setting Today's Price
```sql
INSERT INTO cash_daily_prices (fruitTypeId, priceDate, pricePerKg, createdBy)
VALUES (1, CURRENT_DATE, 95.00, 'admin-user-id');
```

### Viewing All Receptions for Today
```sql
SELECT r.*, c.name as customer_name, f.name as fruit_type
FROM cash_receptions r
JOIN cash_customers c ON r.customerId = c.id
JOIN cash_fruit_types f ON r.fruitTypeId = f.id
WHERE DATE(r.receptionDate) = CURRENT_DATE
ORDER BY r.receptionDate DESC;
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cash/receptions` | List receptions | Viewer+ |
| POST | `/api/cash/receptions` | Create reception | Operator+ |
| PUT | `/api/cash/receptions/{id}` | Update reception | Operator+ |
| GET | `/api/cash/receptions/{id}/invoice` | Generate invoice | Viewer+ |
| POST | `/api/cash/prices` | Set daily price | Admin only |
| POST | `/api/cash/thresholds` | Set quality threshold | Admin only |
| POST | `/api/cash/customers` | Create customer | Operator+ |

## Troubleshooting

### "No price found for date"
**Cause**: Admin hasn't set price for today
**Solution**: Set daily price via `/dashboard/cash-pos/pricing`

### Discount is 0% even with high quality
**Cause**: Quality measurement below threshold
**Solution**: Check threshold configuration at `/dashboard/cash-pos/quality`

### RLS Policy Denying Access
**Cause**: User role not set correctly
**Solution**: Verify JWT contains role claim and policies match

### Invoice not printing correctly
**Cause**: Browser print styles issue
**Solution**: Check `@media print` CSS rules

## Best Practices

1. **Always use transactions** for reception creation (price lookup + insert)
2. **Validate on both client and server** (client for UX, server for security)
3. **Never update pricePerKgSnapshot** - it's immutable
4. **Use RLS policies** - database-level security is critical
5. **Test edge cases**: Missing prices, 100% discount, negative final weight
6. **Log all operations** for audit trail

## Resources

- [OpenAPI Spec](./openapi.yaml) - Complete API documentation
- [Data Model](./data-model.md) - Detailed entity relationships
- [Research](./research.md) - Technical decisions and rationale
- [Feature Spec](./spec.md) - User requirements and acceptance criteria

## Support

Questions? Check the documentation or ask the team lead.
