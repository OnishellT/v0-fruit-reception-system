# Implementation Plan: Cash Point-of-Sale Reception System

**Branch**: `005-cash-pos-system` | **Date**: 2025-11-05 | **Spec**: [link to spec.md](spec.md)
**Input**: Feature specification from `/specs/005-cash-pos-system/spec.md`

## Summary

The Cash POS Reception System provides an isolated domain for handling same-day cash fruit receptions (Café, Cacao, Miel, Cocos) with daily pricing and quality-based discounting. The system features a complete workflow from daily price setup through reception creation, discount calculation, and invoice generation. Key technical requirements include immutable price snapshots, excess-over-threshold discount calculations, role-based access control, and printable invoices with detailed discount breakdowns.

## Technical Context

**Language/Version**: TypeScript/JavaScript with Next.js 15
**Primary Dependencies**: Next.js 15 (App Router), Supabase (PostgreSQL + RLS), Drizzle ORM
**Storage**: PostgreSQL database with Row Level Security (RLS) policies
**Testing**: Playwright E2E tests (existing in repository)
**Target Platform**: Web application (browser-based POS system)
**Project Type**: Web application with App Router structure
**Performance Goals**: Handle 50 concurrent reception entries during peak hours; reception entry completion in under 3 minutes
**Constraints**: Must maintain 100% discount calculation precision; Price snapshots must be immutable; Zero unauthorized access via RBAC
**Scale/Scope**: Support for 4 fruit types with extensible design; isolated cash domain separate from regular reception system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ⚠️ WARNING - Constitution template is unfilled

The project constitution at `.specify/memory/constitution.md` contains template placeholders rather than actual governance rules. The feature specification provides sufficient technical guidance to proceed with implementation planning, but governance policies, testing requirements, and quality gates should be defined for production readiness.

**Impact**: Cannot enforce specific constitutional gates until actual principles are documented. Proceeding with best practices from existing repository structure.

## Project Structure

### Documentation (this feature)

```text
specs/005-cash-pos-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/dashboard/cash-pos/
├── page.tsx                           # Cash POS dashboard
├── receptions/
│   ├── page.tsx                       # Cash receptions list
│   ├── new/
│   │   └── page.tsx                   # Create reception form
│   └── [id]/
│       ├── page.tsx                   # View reception
│       └── edit/
│           └── page.tsx               # Edit reception
├── customers/
│   └── page.tsx                       # Cash customers management
├── fruit-types/
│   └── page.tsx                       # Cash fruit types
├── pricing/
│   └── page.tsx                       # Daily prices management
└── quality/
    └── page.tsx                       # Quality thresholds

components/cash-pos/
├── reception-form.tsx                 # Reception creation/editing
├── reception-list.tsx                 # Receptions table
├── customer-form.tsx                  # Customer registration
├── price-form.tsx                     # Daily price setting
├── threshold-form.tsx                 # Quality thresholds
├── invoice-viewer.tsx                 # Printable invoice
└── discount-breakdown.tsx             # Discount calculation display

lib/actions/
└── cash/                              # Server actions for cash domain
    ├── receptions.ts                  # Reception CRUD
    ├── customers.ts                   # Customer CRUD
    ├── prices.ts                      # Daily price management
    └── quality.ts                     # Threshold management

lib/db/
└── cash.ts                            # Drizzle schema for cash tables

lib/supabase/
└── cash.ts                            # Supabase RLS policies for cash domain

drizzle/
├── schema/
│   └── cash.ts                        # Cash domain schema definitions
└── [migration files]                  # Database migrations

tests/
├── e2e/
│   └── cash-pos/                      # Playwright E2E tests
└── integration/
    └── cash-pos/                      # Integration tests
```

**Structure Decision**: Extending existing Next.js 15 App Router structure with isolated `cash-pos` module under `/dashboard/cash-pos`. Cash domain tables use `cash_` prefix for complete separation from regular reception system. All cash-specific components, actions, and schemas organized under `cash-pos` namespace.

## Constitution Check (Post-Design)

*GATE: Re-evaluated after Phase 1 design completion*

**Status**: ✅ PASS

After completing Phase 1 design and contracts, all technical decisions align with best practices:

1. **Technology Stack**: Next.js 15 + Supabase + Drizzle ORM - aligns with existing codebase
2. **Data Model**: Domain isolation via `cash_` prefix - ensures separation as required
3. **API Design**: RESTful endpoints with proper authentication - standard practice
4. **Security**: RLS policies for RBAC - database-level security
5. **Project Structure**: Extends existing Next.js App Router - consistent with current architecture

**Phase 1 Deliverables**:
- ✅ Research documented (research.md)
- ✅ Data model designed (data-model.md)
- ✅ API contracts defined (contracts/openapi.yaml)
- ✅ Developer onboarding guide created (quickstart.md)
- ✅ Agent context updated with new technology

**Next**: Ready for Phase 2 - Task decomposition (via `/speckit.tasks`)

## Complexity Tracking

No constitutional violations detected. Design remains simple and aligned with existing patterns.
