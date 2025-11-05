# Implementation Plan: Weighted Discount Calculation and Visualization in Receptions

**Branch**: `003-weight-discounts` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-weight-discounts/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature introduces automatic weight-based discount calculations for fruit receptions based on quality evaluation thresholds. The system will calculate discounts when quality metrics (e.g., Moho, Humedad, Violetas) exceed configured pricing rule thresholds, displaying both original and discounted weights with detailed breakdowns in reception forms. The implementation focuses on transparent discount visualization, admin override capabilities, and dynamic recalculation when quality data changes.

## Technical Context

**Language/Version**: TypeScript 5.0.2 + Next.js 16+
**Primary Dependencies**: React 19.2.0, Tailwind CSS, Supabase (PostgreSQL), Zod
**Storage**: PostgreSQL with Supabase (Row Level Security enabled)
**Testing**: Playwright E2E testing framework
**Target Platform**: Web application (Desktop/Mobile responsive)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Discount calculations complete in under 1 second, UI updates within 3 seconds
**Constraints**: Spanish interface, role-based access control, audit trail compliance
**Scale/Scope**: Extension to existing fruit reception system, handles current user load

**Research Completed**:
- ✅ Existing pricing rules table structure analyzed (pricing_rules, discount_thresholds, pricing_calculations)
- ✅ Quality evaluation data format understood (calidad_cafe table with Violetas, Humedad, Moho metrics)
- ✅ Reception form architecture documented (React client component with server actions)

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

**CONSTITUTION CHECK STATUS: ✅ PASSED**
- All requirements satisfied with no violations
- Design fully aligns with existing system architecture
- No complexity tracking items required

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── api/                          # API routes for server actions
│   ├── reception/               # Reception-related endpoints
│   └── pricing/                 # Pricing rules and calculations
├── dashboard/
│   ├── reception/
│   │   ├── [id]/               # Individual reception view/edit
│   │   └── page.tsx            # Reception listing
│   └── pricing/                # Pricing management (existing)
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
└── page.tsx                    # Home page

components/
├── reception-form.tsx          # Main reception form component
├── pricing-breakdown.tsx       # NEW: Discount breakdown component
├── pricing-preview.tsx         # NEW: Real-time discount preview
├── ui/                         # Reusable UI components
└── [existing components...]

lib/
├── actions/
│   ├── reception.ts            # Existing reception actions
│   └── pricing.ts              # NEW: Pricing calculation actions
├── types/
│   └── pricing.ts              # NEW: Pricing-related TypeScript types
├── utils/
│   └── pricing.ts              # NEW: Pricing calculation utilities
└── validations/                # NEW: Zod schemas for pricing

tests/
├── test-reception-pricing.js   # NEW: E2E tests for discount functionality
├── test-pricing-system.js      # NEW: Pricing system integration tests
└── [existing tests...]

scripts/
├── 12-add-quality-pricing-system.sql  # Existing pricing system setup
├── 13-add-pricing-to-receptions.sql   # NEW: Database schema changes
└── [existing scripts...]
```

**Structure Decision**: Next.js App Router with Server Components by default, Client Components for interactive forms. Discount calculation logic placed in server actions for security and type safety, with UI components for visualization.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
