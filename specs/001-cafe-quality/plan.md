# Implementation Plan: Post-Reception Quality Evaluation (Café Seco)

**Branch**: `001-cafe-quality` | **Date**: 2025-10-31 | **Spec**: [link to spec.md]
**Input**: Feature specification from `/specs/001-cafe-quality/spec.md`

## Summary

Build a post-reception quality evaluation system for Café Seco that allows authorized users to record and manage quality attributes (Violetas, Humedad, Moho) for completed receptions. The system implements conditional UI buttons, role-based access control, data validation, and quality data persistence.

**Technical Approach:**
- Create `calidad_cafe` database table with proper RLS policies
- Add server actions for quality data CRUD operations with Zod validation
- Implement conditional button rendering in receptions table (visible only for Café Seco)
- Build modal component for quality evaluation with role-based editing
- Integrate with existing Receptions table and authentication system
- Add quality indicators and visual feedback

## Technical Context

**Language/Version**: TypeScript 5.0.2
**Primary Dependencies**: Next.js 16+, React 19.2.0, Tailwind CSS, Supabase (PostgreSQL)
**Storage**: Supabase PostgreSQL with Row Level Security (RLS)
**Testing**: Playwright E2E testing framework (existing 18+ test files)
**Target Platform**: Web application (Desktop/Mobile responsive)
**Project Type**: single/web application - Next.js App Router architecture
**Performance Goals**: Modal open/close <100ms, data persistence <500ms, build time <2 seconds
**Constraints**: Must work with existing Spanish interface, role-based permissions (admin/operator), soft delete pattern
**Scale/Scope**: ~50-200 quality evaluations per day, 2-10 concurrent users, existing database structure

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
├── dashboard/
│   └── reception/
│       ├── page.tsx               # Modified: Add conditional quality button to table
│       └── [id]/edit/
│           └── page.tsx           # Modified: May need quality data display
├── globals.css
├── layout.tsx
└── page.tsx

lib/
├── actions/
│   ├── reception.ts               # Modified: Add quality-related server actions
│   └── quality-cafe.ts            # NEW: Quality evaluation server actions
├── supabase/
│   └── [client files]
└── utils.ts

components/
├── data-table.tsx                 # Modified: Add quality status indicators
├── reception-form.tsx             # Modified: May need integration
├── quality-evaluation-modal.tsx   # NEW: Quality evaluation modal component
└── [other existing components]

tests/
├── test-reception-*.js            # Modified: Add quality workflow tests
├── test-quality-cafe.js           # NEW: Quality evaluation tests
└── [other existing tests]
```

**Structure Decision**: Using Next.js App Router structure with Server Components as default and Client Components for interactive elements (modal, buttons). Server actions in `lib/actions/` for mutations, reusable components in `components/`, database integration via Supabase client.

## Complexity Tracking

**No constitutional violations identified.**

All implementation decisions align with established constitutional principles:
- Uses existing Next.js App Router architecture
- Implements Server Components → Client Components pattern
- Enforces role-based access control (admin/operator)
- Uses Zod validation for type safety
- Follows Spanish localization requirement
- Implements proper RLS policies
- Uses Server Actions for all mutations

## Final Constitution Check (Post-Design Re-evaluation)

*Re-checked after Phase 1 design completion*

**Code Quality Standards:**
- ✅ TypeScript strict mode maintained
- ✅ Server-Client hybrid architecture (Server Components default, Client for modal)
- ✅ Soft delete pattern (not applicable - quality tied to reception lifecycle)
- ✅ Row Level Security (RLS) enforced on calidad_cafe table
- ✅ Zod schemas for runtime type validation

**Testing Standards (NON-NEGOTIABLE):**
- ✅ Playwright E2E testing framework
- ✅ Will add quality evaluation tests to reach 18+ total test files
- ✅ 9/9 CRUD test pass rate maintained (no changes to existing CRUD)
- ✅ Cross-browser testing compatibility

**User Experience Consistency:**
- ✅ Spanish interface maintained ("Registrar Calidad", "Ver Calidad", "Editar Calidad")
- ✅ Modal follows responsive design pattern (Desktop/Mobile)
- ✅ Real-time search (existing functionality)
- ✅ Mobile keypad support (existing functionality)
- ✅ Audit trail (created_by, updated_by fields)

**Performance Requirements:**
- ✅ Server-Side Rendering (receptions table)
- ✅ Database queries optimized (index on recepcion_id)
- ✅ Build time target maintained (<2 seconds)
- ✅ Next.js App Router features utilized

**Security Requirements:**
- ✅ Custom session-based authentication (existing)
- ✅ Server action validation (not client-side only)
- ✅ HTTP-only secure cookies (existing)
- ✅ Role-based access control (admin/operator enforced in actions)

**Development Guidelines:**
- ✅ Server component → Client component pattern (receptions table → modal)
- ✅ Server actions for mutations (create/update quality)
- ✅ All changes documented (research.md, data-model.md, contracts/, quickstart.md)
- ✅ Backward compatibility (existing functionality unchanged)
- ✅ Next.js 16+ best practices followed

---

## Generated Artifacts

**Phase 0 - Research**: ✅ COMPLETE
- `research.md` - Technical decisions and rationale

**Phase 1 - Design**: ✅ COMPLETE
- `data-model.md` - Entity relationships and validation rules
- `contracts/` - Server actions and component APIs
- `quickstart.md` - Implementation guide
- Agent context updated (`CLAUDE.md`)

---

**Plan completed**: 2025-10-31
**Status**: Ready for Phase 2 (Task Breakdown) via `/speckit.tasks`

