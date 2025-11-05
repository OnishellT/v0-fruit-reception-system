# Implementation Plan: Dynamic Quality-Based Pricing System

**Branch**: `002-quality-pricing-discounts` | **Date**: 2025-10-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-quality-pricing-discounts/spec.md`

## Summary

This feature introduces a flexible pricing adjustment system that automatically calculates discounts based on quality parameters across all fruit types received in the system (Café, Cacao, Miel, Cocos). Administrators can configure custom discount thresholds for each fruit type and quality metric (Violetas, Humedad, Moho), which the system uses to automatically calculate the final payable amount when saving receptions with quality evaluations.

The technical approach involves:
1. **Database Schema Extension**: Adding tables for discount thresholds, pricing rules, and pricing calculations
2. **Configuration Interface**: Creating admin UI for managing thresholds per fruit type and quality metric
3. **Pricing Calculation Engine**: Server-side logic to evaluate quality metrics and apply discounts
4. **Reception Workflow Integration**: Modifying reception saving to include automatic pricing calculation
5. **Historical Data Preservation**: Ensuring pricing calculations are immutable once saved

## Technical Context

**Language/Version**: TypeScript 5.0.2
**Primary Dependencies**: Next.js 16+ (App Router), React 19.2.0, Supabase (PostgreSQL), Tailwind CSS, Zod
**Storage**: Supabase PostgreSQL with Row Level Security (RLS) enforced
**Testing**: Playwright E2E testing framework (minimum 18+ test files, 9/9 CRUD test pass rate)
**Target Platform**: Web application (Linux server deployment)
**Project Type**: Single Next.js application with Server Components pattern
**Performance Goals**: Reception processing in under 5 seconds, handle 50 simultaneous entries
**Constraints**: Server-Side Rendering (SSR) as default, responsive design (Desktop/Mobile), Spanish localization
**Scale/Scope**: Support for 4 fruit types, multiple quality metrics per type, configurable threshold ranges

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality Standards:**
- ✅ TypeScript strict mode enabled (100% type safety)
- ✅ Server-Client hybrid architecture (Next.js App Router with Server Components default)
- ✅ Soft delete pattern implemented for all data operations
- ✅ Row Level Security (RLS) enforced on all database tables
- ✅ Zod schemas for runtime type validation

**Testing Standards (NON-NEGOTIABLE):**
- ✅ Playwright E2E testing framework configured
- ✅ Minimum 18+ test files maintained
- ✅ 9/9 CRUD test pass rate requirement
- ✅ Cross-browser testing (Chrome, Firefox, Safari, Edge) planned

**User Experience Consistency:**
- ✅ Spanish localization maintained throughout
- ✅ Responsive design (Desktop/Mobile/Auto layout toggle)
- ✅ Real-time search across all data tables
- ✅ On-screen keypad support for mobile devices
- ✅ Audit trail logging for all critical actions

**Performance Requirements:**
- ✅ Server-Side Rendering (SSR) as default strategy
- ✅ Database queries optimized with proper indexing
- ✅ Build time target: under 2 seconds
- ✅ Next.js App Router features utilized

**Security Requirements:**
- ✅ Custom session-based authentication (NOT Supabase Auth)
- ✅ bcrypt password hashing implemented
- ✅ HTTP-only secure cookies with proper configuration
- ✅ Role-based access control (RBAC) for admin/operator roles

**Development Guidelines:**
- ✅ Server component → Client component pattern followed
- ✅ Server actions used for all mutations (create, update, delete)
- ✅ All changes documented in markdown files
- ✅ Backward compatibility maintained where possible
- ✅ Next.js 16+ best practices followed

## Project Structure

### Documentation (this feature)

```text
specs/002-quality-pricing-discounts/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── dashboard/           # Main dashboard pages
├── login/               # Authentication pages
├── setup/               # Configuration pages
└── layout.tsx           # Root layout

components/
├── ui/                  # Reusable UI components
└── ...                  # Feature-specific components

lib/
├── supabase/            # Supabase client and utilities
└── utils.ts             # Shared utilities

tests/
├── fixtures/            # Test data
├── helpers/             # Test utilities
└── *.spec.ts            # Test files

supabase/
├── migrations/          # Database migrations
└── functions/           # Edge functions (if needed)
```

**Structure Decision**: Single Next.js application using App Router with Server Components pattern. Components organized by feature in `/components`, shared utilities in `/lib`, database managed via Supabase migrations. Tests located in `/tests` directory using Playwright E2E framework.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [None at this time] | N/A | N/A |

## Phase 0: Research & Analysis

### Existing System Analysis

**Current State Review:**
1. Analyze existing fruit reception workflow and data model
2. Identify current pricing mechanism and base price storage
3. Review existing quality evaluation structure (Violetas, Humedad, Moho)
4. Examine current user roles (Administrator, Reception Operator)
5. Assess current database schema for integration points

**Integration Points:**
- Receptions table (must add pricing calculation fields)
- Quality evaluations table (already exists, need to leverage)
- Fruit types catalog (must link to pricing rules)
- User authentication & RBAC (already exists)

### Technical Dependencies

**Supabase Schema Updates Required:**
1. `pricing_rules` table - configurations per fruit type
2. `discount_thresholds` table - threshold ranges and discount percentages
3. `pricing_calculations` table - historical pricing breakdown per reception
4. Update `receptions` table - add reference to pricing calculation

**Next.js Components Needed:**
1. Pricing configuration interface (admin only)
2. Pricing breakdown display (all users)
3. Integration with existing reception form

**Edge Cases to Address:**
- Quality values outside threshold ranges
- Missing quality metrics
- Simultaneous reception processing
- Historical data immutability

## Phase 1: Data Model & API Contracts

### Database Schema

**Tables to Create/Modify:**

```sql
-- Pricing rules per fruit type
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_type VARCHAR NOT NULL,
  quality_based_pricing_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount thresholds per fruit type and quality metric
CREATE TABLE discount_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_rule_id UUID REFERENCES pricing_rules(id) ON DELETE CASCADE,
  quality_metric VARCHAR NOT NULL, -- e.g., 'Violetas', 'Humedad', 'Moho'
  min_value DECIMAL NOT NULL,
  max_value DECIMAL NOT NULL,
  discount_percentage DECIMAL NOT NULL, -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical pricing calculations per reception
CREATE TABLE pricing_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id UUID NOT NULL,
  base_price_per_kg DECIMAL NOT NULL,
  total_weight DECIMAL NOT NULL,
  gross_value DECIMAL NOT NULL,
  total_discount_amount DECIMAL DEFAULT 0,
  final_total DECIMAL NOT NULL,
  calculation_data JSONB NOT NULL, -- breakdown by metric
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update receptions table
ALTER TABLE receptions ADD COLUMN pricing_calculation_id UUID REFERENCES pricing_calculations(id);
```

### API Contracts

**Server Actions Required:**

1. `getPricingRules(fruitType: string)` - Retrieve pricing configuration
2. `updatePricingRules(rules: PricingRuleInput)` - Save/update pricing configuration
3. `getDiscountThresholds(fruitType: string)` - Get thresholds for a fruit type
4. `createDiscountThreshold(threshold: ThresholdInput)` - Add new threshold
5. `updateDiscountThreshold(id: string, threshold: ThresholdInput)` - Modify threshold
6. `deleteDiscountThreshold(id: string)` - Remove threshold
7. `calculateReceptionPricing(receptionData: ReceptionInput)` - Calculate pricing for a reception
8. `saveReceptionWithPricing(receptionData: ReceptionInput)` - Save reception with calculated pricing

### TypeScript Types (Zod Schemas)

```typescript
// Pricing Rules
export const PricingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  fruitType: z.string(),
  qualityBasedPricingEnabled: z.boolean(),
  thresholds: z.array(z.object({
    id: z.string().uuid().optional(),
    qualityMetric: z.string(),
    minValue: z.number(),
    maxValue: z.number(),
    discountPercentage: z.number().min(0).max(100)
  }))
});

// Pricing Calculation
export const PricingCalculationSchema = z.object({
  receptionId: z.string().uuid(),
  basePricePerKg: z.number(),
  totalWeight: z.number(),
  grossValue: z.number(),
  discounts: z.array(z.object({
    qualityMetric: z.string(),
    value: z.number(),
    discountPercentage: z.number(),
    discountAmount: z.number()
  })),
  totalDiscountAmount: z.number(),
  finalTotal: z.number()
});
```

## Phase 2: Implementation Tasks

See `tasks.md` for detailed implementation breakdown.

**High-Level Task Groups:**

1. **Database Migration (Day 1)**
   - Create new tables for pricing rules, thresholds, and calculations
   - Add foreign key to receptions table
   - Set up RLS policies

2. **Server-Side Logic (Days 1-2)**
   - Implement pricing calculation engine
   - Create server actions for CRUD operations
   - Add validation with Zod schemas

3. **Admin Configuration UI (Days 2-3)**
   - Pricing rules management interface
   - Threshold configuration forms
   - Fruit type selection and toggles

4. **Reception Integration (Days 3-4)**
   - Modify reception saving workflow
   - Add pricing breakdown display
   - Integrate with existing quality evaluation

5. **Testing (Days 4-5)**
   - Write E2E tests for configuration workflow
   - Test pricing calculations with various inputs
   - Verify historical data preservation
   - Cross-browser testing

6. **Documentation (Day 5)**
   - Update user documentation
   - Add code comments
   - Create quickstart guide

## Next Steps

1. **Phase 0**: Execute research and analysis (existing system review)
2. **Phase 1**: Design data model and API contracts (detailed schema design)
3. **Phase 2**: Implementation (see tasks.md for breakdown)
4. **Phase 3**: Testing & QA (E2E test execution)
5. **Phase 4**: Deployment & Documentation (user guides and code docs)

---

**Status**: Ready for Phase 0 (Research & Analysis)
**Next Command**: `/speckit.tasks` - Generate detailed implementation tasks