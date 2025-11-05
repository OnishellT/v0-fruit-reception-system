# Research Phase: Cash POS Reception System

**Date**: 2025-11-05
**Feature**: Cash Point-of-Sale Reception System
**Status**: Complete

## Research Objectives

Resolve any technical unknowns and validate design decisions for the Cash POS Reception System implementation.

## Technical Stack Decisions

### Decision: Next.js 15 with App Router
**Chosen**: Next.js 15 (App Router)

**Rationale**: Feature specification explicitly requires Next.js 15 with App Router. Existing codebase uses this stack, ensuring consistency with current architecture.

**Alternatives Considered**: None - specified in requirements.

---

### Decision: Supabase (PostgreSQL + RLS)
**Chosen**: Supabase with PostgreSQL database and Row Level Security

**Rationale**: Feature specification requires RBAC with three roles (Admin, Operator, Viewer) enforced through RLS. Supabase provides built-in RLS policy support and authentication integration. Existing codebase uses Supabase.

**Alternatives Considered**:
- Custom RBAC implementation: Rejected due to security complexity and existing Supabase infrastructure
- AWS IAM + RDS: More complex setup, no built-in RLS equivalent

---

### Decision: Drizzle ORM
**Chosen**: Drizzle ORM for database schema and queries

**Rationale**: Feature specification requires Drizzle ORM with explicit schema definitions. Drizzle provides type-safe queries and integrates well with Next.js and Supabase. Existing codebase uses Drizzle.

**Alternatives Considered**:
- Supabase JS client directly: Rejected due to lack of type safety
- Prisma: Not used in existing codebase, would add dependency complexity

---

## Design Patterns & Implementation Strategy

### Decision: Domain Isolation Pattern
**Chosen**: Complete separation of cash domain using `cash_` table prefix

**Rationale**: Feature specification requires isolated domain "separate from the normal reception system." Table prefixing ensures no data leakage or cross-contamination between systems. Allows independent evolution of cash POS workflows without affecting regular receptions.

**Implementation**:
- All cash tables use `cash_` prefix
- Separate UI routes under `/dashboard/cash-pos`
- Isolated components in `components/cash-pos/`
- Dedicated server actions in `lib/actions/cash/`

**Alternatives Considered**:
- Shared tables with type flags: Rejected due to complexity and risk of bugs
- Separate database: Overkill for feature isolation requirement

---

### Decision: Price Snapshot Pattern
**Chosen**: Immutable price snapshot stored at reception creation time

**Rationale**: Business requirement: "Price changes are not retroactive; past receptions keep their original price snapshot." Snapshotting ensures financial integrity and audit trail.

**Implementation**:
- Store `pricePerKgSnapshot` in reception record
- Price lookup occurs at creation: finds active price for (fruitType, date)
- Snapshot is immutable - never updated
- Price changes only affect future receptions

**Alternatives Considered**:
- Dynamic price lookup on viewing: Rejected - financial records must be fixed at transaction time
- Price history with effective dates: More complex, snapshots are simpler and safer

---

### Decision: Excess-Over-Threshold Discount Calculation
**Chosen**: Calculate discount as excess percentage over threshold, applied to total weight

**Rationale**: Feature specification example: "Threshold Humidity = 30%. Entered = 40% ⇒ discount = 10% of weight." This is transparent and fair - customers pay full price up to threshold, only excess is discounted.

**Formula**:
```
perMetricPercent = max(0, value - threshold)
combinedPercent = clamp(sum(perMetricPercent), 0, 100)
discountWeightKg = totalWeightKgOriginal × (combinedPercent / 100)
finalWeightKg = totalWeightKgOriginal - discountWeightKg
```

**Edge Cases Handled**:
- Multiple metrics: Sum all excess percentages
- Combined discount > 100%: Clamp to prevent negative weight
- Missing measurements: Treated as null/zero (no discount)

---

### Decision: Role-Based Access Control (RBAC)
**Chosen**: Three-tier RBAC (Admin, Operator, Viewer) enforced via Supabase RLS

**Rationale**: Feature specification requires RBAC for financial data protection. Supabase RLS provides database-level security. Three roles provide appropriate granularity for farm operations.

**Role Definitions**:
- **Admin**: Full access - can set prices, configure thresholds, manage all data
- **Operator**: Reception data entry - can create/modify receptions and customers, cannot change prices
- **Viewer**: Read-only access - can view all data but cannot modify

**Implementation**: Row Level Security policies in Supabase enforce permissions at database level

**Alternatives Considered**:
- Two-tier (Admin/User): Insufficient granularity for farm operations
- Application-level only: Less secure, RLS provides defense-in-depth

---

## Key Technical Considerations

### 1. Discount Calculation Precision
**Requirement**: 100% precision in discount calculations

**Solution**:
- Use numeric/decimal types for all financial calculations
- Fixed precision: 3 decimal places for weight, 4 for pricing
- JavaScript number operations may cause precision loss - use decimal library or database calculations
- Store computed values in database to avoid recalculation precision drift

### 2. Real-time Discount Updates
**Requirement**: Display live discount calculations as operator enters quality measurements

**Solution**:
- Client-side calculation using threshold data
- Formula: `discountPercent = sum(max(0, value - threshold))`
- Display: discount %, discount kg, final kg, amounts
- Server validates and recomputes on save (source of truth)

### 3. Invoice Generation
**Requirement**: Printable invoice with detailed discount breakdown

**Solution**:
- Server-rendered HTML with print styles
- Components: customer info, original weight, per-metric breakdown, final weight, totals
- Print-optimized CSS for 8.5"×11" paper
- Browser print dialog (no PDF generation required initially)

### 4. Daily Price Lookup
**Requirement**: Find active price for (fruitType, date) at reception creation

**Solution**:
- Query: `SELECT pricePerKg FROM cash_daily_prices WHERE fruitTypeId = ? AND priceDate = ? AND active = true ORDER BY createdAt DESC LIMIT 1`
- Fail if no price found
- Store snapshot immediately after lookup

---

## Security & Data Protection

### RLS Policy Design
```sql
-- Example policies (actual implementation in lib/supabase/cash.ts)
CREATE POLICY "cash_customers_select_authenticated" ON cash_customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cash_customers_modify_admin_operator" ON cash_customers
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'operator'));
```

### Audit Trail
All cash entities include:
- `createdAt`: timestamp
- `createdBy`: user ID (auth.uid())
- Future: `updatedAt`, `updatedBy` for modifications

---

## Performance Considerations

### Target: 50 Concurrent Users
- Database: PostgreSQL with proper indexing on foreign keys
- UI: Minimize roundtrips, use client-side calculations for discounts
- Real-time: Calculations in browser, not server calls on every keystroke

### Database Indexes Required
- `cash_daily_prices(fruitTypeId, priceDate, active)`
- `cash_receptions(receptionDate)`
- `cash_receptions(customerId)`
- All foreign key columns

---

## Summary

All technical decisions align with feature specification requirements. No unresolved technical unknowns. Ready to proceed to Phase 1: Design & Contracts.

**Key Design Patterns**:
1. Domain isolation via `cash_` prefix
2. Immutable price snapshots
3. Excess-over-threshold discounting
4. Three-tier RBAC with RLS
5. Real-time client-side calculations with server validation

**Risks Mitigated**:
- Precision loss: Fixed-point arithmetic in database
- Security: RLS policies at database level
- Data integrity: Immutable snapshots
- Performance: Minimal roundtrips, proper indexing
