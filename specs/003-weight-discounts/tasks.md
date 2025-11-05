---

description: "Task list for Weighted Discount Calculation and Visualization feature implementation"
---

# Tasks: Weighted Discount Calculation and Visualization in Receptions

**Input**: Design documents from `/specs/003-weight-discounts/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested as this is a critical financial feature with audit requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `components/`, `lib/`, `tests/` at repository root
- **Database migrations**: `scripts/`
- **Type definitions**: `lib/types/`
- **Server actions**: `lib/actions/`
- **UI components**: `components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create feature branch `003-weight-discounts` and verify development environment
- [ ] T002 [P] Create new directory structure for pricing components in `lib/types/pricing.ts`, `lib/utils/pricing.ts`, `lib/validations/pricing.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema and type definitions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Migration
- [ ] T003 Create database migration script `scripts/13-add-pricing-to-receptions.sql` with weight discount columns and desglose_descuentos table
- [ ] T004 [P] Add database constraints for weight discount fields in migration script
- [ ] T005 [P] Add performance indexes for discount queries in migration script
- [ ] T006 [P] Add RLS policies for desglose_descuentos table in migration script

### Type Definitions & Validation
- [ ] T007 Create TypeScript interfaces for weight discount system in `lib/types/pricing.ts`
- [ ] T008 [P] Create Zod validation schemas for pricing data in `lib/validations/pricing.ts`
- [ ] T009 [P] Create utility functions for discount calculations in `lib/utils/pricing.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Weight Discount Calculation (Priority: P1) 🎯 MVP

**Goal**: Automatically calculate weight discounts when quality metrics exceed configured thresholds

**Independent Test**: Create a reception with quality data above thresholds and verify the correct discount calculations are applied and displayed

### Tests for User Story 1 (Write FIRST, ensure they FAIL before implementation) ⚠️

- [ ] T010 [P] [US1] Create E2E test for automatic discount calculation in `tests/test-reception-pricing.js`
- [ ] T011 [P] [US1] Create unit test for discount calculation logic in `tests/test-pricing-system.js`

### Implementation for User Story 1

- [ ] T012 [US1] Implement calculateWeightDiscounts server action in `lib/actions/pricing.ts`
- [ ] T013 [US1] Create pricing calculation utilities in `lib/utils/pricing.ts` (extends T009)
- [ ] T014 [US1] Extend existing reception form to include discount calculation triggers in `components/reception-form.tsx`
- [ ] T015 [US1] Add form state for weight discount data in `components/reception-form.tsx`
- [ ] T016 [US1] Implement real-time discount calculation when quality data changes
- [ ] T017 [US1] Add discount data persistence to reception creation/update server actions

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Discount Breakdown Visualization (Priority: P1)

**Goal**: Display clear breakdown showing how each quality metric contributed to total weight discount

**Independent Test**: View a reception with applied discounts and confirm the breakdown shows each metric's contribution accurately

### Tests for User Story 2 (Write FIRST, ensure they FAIL before implementation) ⚠️

- [ ] T018 [P] [US2] Create E2E test for discount breakdown display in `tests/test-reception-pricing.js`
- [ ] T019 [P] [US2] Create component test for pricing breakdown display

### Implementation for User Story 2

- [ ] T020 [US2] Create PricingBreakdown component in `components/pricing-breakdown.tsx`
- [ ] T021 [US2] Implement getDiscountBreakdown server action in `lib/actions/pricing.ts`
- [ ] T022 [US2] Integrate PricingBreakdown component into reception form in `components/reception-form.tsx`
- [ ] T023 [US2] Add responsive design for mobile and desktop views in pricing breakdown
- [ ] T024 [US2] Implement expandable breakdown details for quality metrics
- [ ] T025 [US2] Add Spanish localization for all discount breakdown text

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Admin Manual Adjustment (Priority: P2)

**Goal**: Allow administrators to manually adjust discount percentages or final weights when necessary

**Independent Test**: Admin edits a reception with discounts and modifies final values, verifying changes persist correctly

### Tests for User Story 3 (Write FIRST, ensure they FAIL before implementation) ⚠️

- [ ] T026 [P] [US3] Create E2E test for admin discount override in `tests/test-reception-pricing.js`
- [ ] T027 [P] [US3] Create permission test for admin-only access control

### Implementation for User Story 3

- [ ] T028 [US3] Implement adminOverrideWeightDiscounts server action in `lib/actions/pricing.ts`
- [ ] T029 [US3] Create admin override form component in `components/pricing-override.tsx`
- [ ] T030 [US3] Add permission checks for admin-only editing in pricing components
- [ ] T031 [US3] Implement audit logging for manual overrides in server actions
- [ ] T032 [US3] Integrate admin override interface into reception edit mode
- [ ] T033 [US3] Add override reason field and validation

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Dynamic Recalculation (Priority: P2)

**Goal**: Automatically recalculate discounts when quality data or fruit type changes

**Independent Test**: Modify quality data or fruit type in editable reception and confirm discounts recalculate automatically

### Tests for User Story 4 (Write FIRST, ensure they FAIL before implementation) ⚠️

- [ ] T034 [P] [US4] Create E2E test for dynamic recalculation in `tests/test-reception-pricing.js`
- [ ] T035 [P] [US4] Create unit test for recalculation triggers

### Implementation for User Story 4

- [ ] T036 [US4] Implement useEffect hooks for real-time recalculation in `components/reception-form.tsx`
- [ ] T037 [US4] Add debounced calculation to prevent excessive server calls
- [ ] T038 [US4] Implement fruit type change handling with threshold re-fetching
- [ ] T039 [US4] Add loading states and error handling for recalculation
- [ ] T040 [US4] Optimize calculation performance for real-time updates
- [ ] T041 [US4] Handle edge cases (missing data, invalid thresholds)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T042 [P] Update documentation in `docs/` with weight discount feature details
- [ ] T043 Add comprehensive error handling and user-friendly error messages
- [ ] T044 [P] Performance optimization for discount calculations and UI rendering
- [ ] T045 [P] Additional unit tests for edge cases and boundary conditions in `tests/`
- [ ] T046 Security hardening for discount override permissions
- [ ] T047 Run quickstart.md validation to ensure setup instructions work
- [ ] T048 Add accessibility improvements for discount breakdown display
- [ ] T049 Implement cross-browser testing for discount functionality
- [ ] T050 Add monitoring and logging for discount calculation performance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Builds on US1/US2 but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Enhances all stories but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD approach for financial accuracy)
- Type definitions before implementation
- Core calculation logic before UI components
- Basic functionality before advanced features
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, P1 stories (US1, US2) can start in parallel
- P2 stories (US3, US4) can start after P1 stories or in parallel with different developers
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1 Implementation

```bash
# Launch all tests for User Story 1 together (TDD approach):
Task: "T010 Create E2E test for automatic discount calculation in tests/test-reception-pricing.js"
Task: "T011 Create unit test for discount calculation logic in tests/test-pricing-system.js"

# Launch all implementation tasks for User Story 1 together:
Task: "T012 Implement calculateWeightDiscounts server action in lib/actions/pricing.ts"
Task: "T013 Create pricing calculation utilities in lib/utils/pricing.ts"
Task: "T017 Add discount data persistence to reception creation/update server actions"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Automatic calculation)
4. **STOP and VALIDATE**: Test User Story 1 independently with sample data
5. Deploy/demo core discount calculation functionality

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Visualization!)
4. Add User Story 3 → Test independently → Deploy/Demo (Admin control!)
5. Add User Story 4 → Test independently → Deploy/Demo (Dynamic updates!)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Core calculation)
   - Developer B: User Story 2 (Visualization)
3. After P1 stories complete:
   - Developer A: User Story 3 (Admin overrides)
   - Developer B: User Story 4 (Dynamic recalculation)
4. Stories complete and integrate independently

---

## Risk Mitigation & Quality Assurance

### Financial Accuracy Requirements
- All discount calculations MUST be tested with known values before implementation
- Server-side validation required for all discount modifications
- Audit trail mandatory for all manual overrides
- Precision maintained to 2 decimal places for all weight calculations

### Performance Requirements
- Discount calculations must complete in under 1 second
- UI updates must display within 3 seconds
- Mobile responsiveness maintained across all discount features

### Security Requirements
- Admin-only access control for override functionality
- Row Level Security enforced on all discount data
- Session validation for all discount operations
- Comprehensive audit logging for compliance

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Critical**: Verify tests fail before implementing for financial accuracy
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Database migration must be tested thoroughly before user story implementation
- Spanish localization required for all user-facing text
- Mobile responsive design mandatory for all new components