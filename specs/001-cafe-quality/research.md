# Research: Post-Reception Quality Evaluation (Café Seco)

**Phase**: 0 - Research
**Date**: 2025-10-31

## Research Objectives

This document consolidates technical research and decisions for implementing the quality evaluation feature.

## Technical Decisions

### Decision 1: Database Schema Design
**What was chosen**: Create `calidad_cafe` table with proper foreign key relationships and audit fields
**Rationale**: Maintains data integrity, follows existing database patterns, enables audit trail
**Alternatives considered**:
- Embed quality data in existing `reception_details` table → rejected: violates separation of concerns
- Create separate table with trigger-based sync → rejected: adds complexity without benefit
- JSON field in `receptions` table → rejected: difficult to query and validate

### Decision 2: Server Actions Pattern
**What was chosen**: Create dedicated `quality-cafe.ts` server action file with create/update/view operations
**Rationale**: Follows existing pattern in codebase (drivers.ts, providers.ts, etc.), enables TypeScript strict typing, centralized logic
**Alternatives considered**:
- Add quality methods to existing `reception.ts` → rejected: mixes concerns, file already large
- Inline server actions in page components → rejected: violates reusability principle
- Separate API routes → rejected: server actions provide better type safety

### Decision 3: Modal Component Strategy
**What was chosen**: Create `quality-evaluation-modal.tsx` as a client component with props-based data passing
**Rationale**: Reusable component, proper separation of concerns, follows existing modal patterns in codebase
**Alternatives considered**:
- Inline modal in reception page → rejected: violates DRY principle
- Multiple modal variants → rejected: adds maintenance burden
- Separate page for quality evaluation → rejected: breaks user workflow, requires navigation

### Decision 4: Permission Enforcement
**What was chosen**: Check user role in server actions and enforce read-only mode in modal for non-admins
**Rationale**: Defense in depth - validation on both client and server, follows RBAC pattern
**Alternatives considered**:
- Client-side only validation → rejected: security risk
- Database-level RLS policies → rejected: too restrictive for viewing existing data
- Separate routes for admin/operator → rejected: code duplication

### Decision 5: Validation Strategy
**What was chosen**: Use Zod schemas for runtime validation (0-100 range), backend enforcement
**Rationale**: Consistent with existing codebase patterns, catches errors early
**Alternatives considered**:
- Client-side only validation → rejected: insufficient
- Custom validation functions → rejected: less maintainable than Zod
- Database constraints → rejected: poor error messages

### Decision 6: Button Visibility Logic
**What was chosen**: Check fruit type/subtype in client component with server-side verification in action
**Rationale**: Prevents accidental exposure, immediate UI feedback
**Alternatives considered**:
- Server-side rendering only → rejected: less responsive
- Client-side only → rejected: potential security bypass

### Decision 7: Quality Data Display
**What was chosen**: Button label changes based on quality data existence ("Registrar Calidad" → "Ver/Editar Calidad")
**Rationale**: Intuitive UX, immediate visual feedback, follows existing button patterns
**Alternatives considered**:
- Static button with state indicator → rejected: less clear
- Separate buttons for each state → rejected: UI clutter
- Modal content-based labeling → rejected: requires opening modal

## Integration Points

### With Existing Receptions System
- Extend reception table queries to include quality data
- Modify DataTable component to show quality status
- Reuse existing authentication and session management

### With User Management
- Utilize existing role-based access control
- Leverage current user session for audit trail

### With Database Architecture
- Follow existing soft delete pattern
- Implement proper RLS policies matching other tables
- Use consistent UUID generation and indexing

## Unknowns Resolved

1. **Database migration approach**: Will use SQL migration file following existing pattern (e.g., `scripts/08-add-quality-cafe.sql`)
2. **TypeScript types**: Will extend existing type definitions in `lib/types/` if needed
3. **Spanish translations**: All text strings already in Spanish per spec
4. **Mobile responsiveness**: Modal will use Tailwind responsive classes like existing modals
5. **Error handling**: Will follow existing pattern using try/catch and user feedback in modals

## Architecture Alignment

### Next.js Best Practices
- Server Components for data fetching
- Client Components for interactive elements (modal)
- Server Actions for mutations
- Proper TypeScript strict typing

### Supabase Integration
- RLS policies for data security
- Foreign key constraints for integrity
- Audit fields (created_by, updated_by, timestamps)

## Testing Strategy

### E2E Test Coverage
- Button visibility for different fruit types
- Quality data entry workflow
- Permission enforcement
- Data persistence and retrieval
- Modal open/close interactions

### Integration Points
- Receptions table integration
- Authentication system integration
- Database operations

## Performance Considerations

- Modal component lazy loading (if needed)
- Efficient database queries with proper indexing
- Minimal re-renders through proper state management
- Maintain existing <2 second build time

## Security Considerations

- Server-side validation of fruit type
- Role-based permissions enforced at action level
- CSRF protection through Next.js built-in features
- SQL injection prevention through parameterized queries

---

**Research completed**: 2025-10-31
**Next phase**: Design & Contracts (Phase 1)
