# Tasks: Cash Point-of-Sale Reception System

**Input**: Design documents from `/specs/005-cash-pos-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for cash POS domain

- [ ] T001 Create cash-pos directory structure per implementation plan in app/dashboard/cash-pos/
- [ ] T002 Create components directory structure in components/cash-pos/
- [ ] T003 Create server actions directory structure in lib/actions/cash/
- [ ] T004 Create database schema directory structure in drizzle/schema/
- [ ] T005 [P] Configure Supabase client for cash domain in lib/supabase/
- [ ] T006 [P] Setup TypeScript configuration for new directories
- [ ] T007 [P] Configure ESLint and Prettier for new cash-pos module

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 [P] Create Drizzle schema for cash_fruit_types in drizzle/schema/cash.ts
- [ ] T009 [P] Create Drizzle schema for cash_customers in drizzle/schema/cash.ts
- [ ] T010 [P] Create Drizzle schema for cash_daily_prices in drizzle/schema/cash.ts
- [ ] T011 [P] Create Drizzle schema for cash_quality_thresholds in drizzle/schema/cash.ts
- [ ] T012 [P] Create Drizzle schema for cash_receptions in drizzle/schema/cash.ts
- [ ] T013 Generate database migration for cash tables using Drizzle migrate
- [ ] T014 [P] Seed initial fruit types (Café, Cacao, Miel, Cocos) in database
- [ ] T015 Setup Supabase RLS policies for all cash tables in lib/supabase/cash.ts
- [ ] T016 Create discount calculation utility in lib/utils/discounts.ts
- [ ] T017 Create price lookup utility in lib/utils/price-lookup.ts
- [ ] T018 Setup role-based access control middleware for Admin/Operator/Viewer roles

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Daily Pricing Setup (Priority: P1) 🎯 MVP

**Goal**: Admin users can set daily prices per fruit type, enabling all cash reception workflows

**Independent Test**: Admin can set a price for Café at RD$ 95.00 for today's date, and the system stores it as the active price

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create cash fruit types page in app/dashboard/cash-pos/fruit-types/page.tsx
- [ ] T020 [P] [US1] Create daily prices page in app/dashboard/cash-pos/pricing/page.tsx
- [ ] T021 [P] [US1] Implement server action for creating/updating daily prices in lib/actions/cash/prices.ts
- [ ] T022 [P] [US1] Create price form component in components/cash-pos/price-form.tsx
- [ ] T023 [P] [US1] Create price list component in components/cash-pos/price-list.tsx
- [ ] T024 [US1] Implement price lookup function for reception creation (depends on T021)
- [ ] T025 [US1] Add validation for price existence before enabling receptions
- [ ] T026 [US1] Add price history tracking and display
- [ ] T027 [US1] Implement price activation/deactivation logic

**Checkpoint**: At this point, User Story 1 should be fully functional - admins can set daily prices that persist and are used by receptions

---

## Phase 4: User Story 2 - Quality Threshold Configuration (Priority: P1) 🎯 MVP

**Goal**: Admin users configure quality thresholds per fruit type for automatic discount calculation

**Independent Test**: Admin can configure a Humidity threshold of 30% for Café, and when an operator enters 40% humidity, the system applies a 10% discount

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create quality thresholds page in app/dashboard/cash-pos/quality/page.tsx
- [ ] T029 [P] [US2] Implement server action for CRUD operations on quality thresholds in lib/actions/cash/quality.ts
- [ ] T030 [P] [US2] Create threshold form component in components/cash-pos/threshold-form.tsx
- [ ] T031 [P] [US2] Create threshold list component in components/cash-pos/threshold-list.tsx
- [ ] T032 [US2] Implement threshold lookup for discount calculation (depends on T029)
- [ ] T033 [US2] Integrate discount calculation with quality thresholds (depends on T016, T032)
- [ ] T034 [US2] Add validation for threshold percentages (0-100 range)
- [ ] T035 [US2] Implement metric enable/disable functionality

**Checkpoint**: At this point, User Story 2 should be fully functional - admins can configure thresholds that drive discount calculations

---

## Phase 5: User Story 3 - Customer Registration (Priority: P2)

**Goal**: Operators can register cash customers with name and national ID for reception association

**Independent Test**: Operator can create a new customer with name "Juan Pérez" and cédula "001-0123456-7", and this customer appears in the customer selection dropdown

### Implementation for User Story 3

- [ ] T036 [P] [US3] Create customers management page in app/dashboard/cash-pos/customers/page.tsx
- [ ] T037 [P] [US3] Implement server action for customer CRUD in lib/actions/cash/customers.ts
- [ ] T038 [P] [US3] Create customer form component in components/cash-pos/customer-form.tsx
- [ ] T039 [P] [US3] Create customer list component in components/cash-pos/customer-list.tsx
- [ ] T040 [US3] Add customer search functionality by name and national ID
- [ ] T041 [US3] Implement customer validation (unique national ID, name length)
- [ ] T042 [US3] Create customer selection dropdown component for receptions

**Checkpoint**: At this point, User Story 3 should be fully functional - customers can be registered and used in receptions

---

## Phase 6: User Story 4 - Cash Reception Creation (Priority: P1) 🎯 MVP

**Goal**: Operators create cash receptions with weight and quality measurements, receiving immediate payment calculations with discounts

**Independent Test**: Operator can create a Café reception with 200kg weight and quality measurements, see live discount calculations, and save the reception with a finalized amount

### Implementation for User Story 4

- [ ] T043 [P] [US4] Create reception creation page in app/dashboard/cash-pos/receptions/new/page.tsx
- [ ] T044 [P] [US4] Create reception form component in components/cash-pos/reception-form.tsx
- [ ] T045 [P] [US4] Create discount breakdown component in components/cash-pos/discount-breakdown.tsx
- [ ] T046 [P] [US4] Implement server action for creating receptions in lib/actions/cash/receptions.ts
- [ ] T047 [US4] Implement real-time discount calculation on client side (depends on T016, T032)
- [ ] T048 [US4] Implement price snapshot on reception creation (depends on T024)
- [ ] T049 [US4] Add validation for missing price scenarios (block creation)
- [ ] T050 [US4] Add validation for excessive discounts (>100%, warn user)
- [ ] T051 [US4] Add validation for negative final weight (block save)
- [ ] T052 [US4] Implement reception list view in app/dashboard/cash-pos/receptions/page.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional - operators can create complete receptions with accurate discount calculations

---

## Phase 7: User Story 5 - Invoice Generation and Printing (Priority: P2)

**Goal**: Generate printable invoices showing customer details, weights, discount breakdown, and totals

**Independent Test**: Operator can view a reception and print an invoice showing original weight, detailed discount breakdown, final weight, and total amount

### Implementation for User Story 5

- [ ] T053 [P] [US5] Create invoice viewing page in app/dashboard/cash-pos/receptions/[id]/page.tsx
- [ ] T054 [P] [US5] Implement invoice viewer component in components/cash-pos/invoice-viewer.tsx
- [ ] T055 [P] [US5] Create printable invoice HTML template
- [ ] T056 [US5] Add print CSS styles for 8.5"×11" paper
- [ ] T057 [US5] Include customer details, fruit type, original/final weights in invoice
- [ ] T058 [US5] Include per-metric discount breakdown in invoice
- [ ] T059 [US5] Include price snapshot and financial totals in invoice
- [ ] T060 [US5] Add signature lines and company header to invoice

**Checkpoint**: At this point, User Story 5 should be fully functional - complete invoices can be generated and printed

---

## Phase 8: User Story 6 - Role-Based Access Control (Priority: P1) 🎯 MVP

**Goal**: Enforce role-based permissions - Admin (prices/thresholds), Operator (receptions/customers), Viewer (read-only)

**Independent Test**: An Operator cannot access the daily pricing interface, and attempts to set prices result in an access denied message

### Implementation for User Story 6

- [ ] T061 [P] [US6] Create navigation guards for Admin-only routes (pricing, quality, fruit-types)
- [ ] T062 [P] [US6] Create navigation guards for Operator/Admin routes (receptions, customers)
- [ ] T063 [P] [US6] Create navigation guards for Viewer routes (read-only access)
- [ ] T064 [US6] Implement server-side role validation in all cash server actions
- [ ] T065 [US6] Add RLS policies to database for role enforcement (revisit T015)
- [ ] T066 [US6] Add UI error messages for unauthorized access attempts
- [ ] T067 [US6] Create role-based button visibility in all forms

**Checkpoint**: At this point, User Story 6 should be fully functional - RBAC prevents unauthorized access across all features

---

## Phase 9: User Story 7 - Reception Editing (Priority: P3)

**Goal**: Edit existing receptions to correct data entry errors while preserving price snapshots and recalculating discounts

**Independent Test**: Operator can edit quality measurements on a past reception, and the system recalculates discounts based on new values while keeping the original price

### Implementation for User Story 7

- [ ] T068 [P] [US7] Create reception edit page in app/dashboard/cash-pos/receptions/[id]/edit/page.tsx
- [ ] T069 [P] [US7] Create edit form component reusing reception-form.tsx
- [ ] T070 [P] [US7] Implement server action for updating receptions in lib/actions/cash/receptions.ts
- [ ] T071 [US7] Ensure price snapshot remains immutable during edits (no price recalculation)
- [ ] T072 [US7] Recalculate discounts when quality measurements change
- [ ] T073 [US7] Recalculate discounts when weight changes
- [ ] T074 [US7] Maintain audit trail of changes (add updated_at, updated_by fields)

**Checkpoint**: At this point, User Story 7 should be fully functional - receptions can be edited with preserved financial integrity

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that enhance all user stories

- [ ] T075 [P] Add E2E test for User Story 1 (pricing setup) in tests/e2e/cash-pos/pricing.spec.ts
- [ ] T076 [P] Add E2E test for User Story 2 (threshold config) in tests/e2e/cash-pos/thresholds.spec.ts
- [ ] T077 [P] Add E2E test for User Story 3 (customer registration) in tests/e2e/cash-pos/customers.spec.ts
- [ ] T078 [P] Add E2E test for User Story 4 (reception creation) in tests/e2e/cash-pos/reception-create.spec.ts
- [ ] T079 [P] Add E2E test for User Story 5 (invoice printing) in tests/e2e/cash-pos/invoice.spec.ts
- [ ] T080 [P] Add E2E test for User Story 6 (RBAC) in tests/e2e/cash-pos/rbac.spec.ts
- [ ] T081 [P] Add E2E test for User Story 7 (reception editing) in tests/e2e/cash-pos/reception-edit.spec.ts
- [ ] T082 [P] Performance optimization: Add database indexes for cash_receptions
- [ ] T083 [P] Add comprehensive error handling across all server actions
- [ ] T084 [P] Add loading states and spinners for all async operations
- [ ] T085 [P] Add form validation with user-friendly error messages
- [ ] T086 Add integration test suite in tests/integration/cash-pos/
- [ ] T087 Update documentation in quickstart.md with latest implementation details
- [ ] T088 Code cleanup and refactoring across cash-pos module
- [ ] T089 Security hardening: Add CSRF protection to all forms
- [ ] T090 Add comprehensive logging for all cash operations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 (price lookup) and US2 (thresholds)
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US4 (receptions exist)
- **User Story 6 (P1)**: Can start after Foundational (Phase 2) - Can be implemented in parallel, affects all stories
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Depends on US4 (reception creation)

### Within Each User Story

- Database schema (Drizzle) before server actions
- Server actions before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, P1 user stories can start in parallel:
  - User Story 1 (Daily Pricing)
  - User Story 2 (Quality Thresholds)
  - User Story 6 (RBAC)
- User Stories 3 and 5 (both P2) can run in parallel after foundational
- User Story 7 (P3) should wait until User Story 4 is complete

---

## Parallel Example: P1 User Stories

```bash
# After Phase 2 (Foundational) completes:

# Team Member A: User Story 1 (Daily Pricing)
Task: "Create cash fruit types page in app/dashboard/cash-pos/fruit-types/page.tsx"
Task: "Create daily prices page in app/dashboard/cash-pos/pricing/page.tsx"

# Team Member B: User Story 2 (Quality Thresholds)
Task: "Create quality thresholds page in app/dashboard/cash-pos/quality/page.tsx"
Task: "Implement server action for threshold CRUD in lib/actions/cash/quality.ts"

# Team Member C: User Story 6 (RBAC)
Task: "Create navigation guards for Admin-only routes"
Task: "Implement server-side role validation in all server actions"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Daily Pricing) - **MVP Part 1**
4. Complete Phase 4: User Story 2 (Quality Thresholds) - **MVP Part 2**
5. Complete Phase 8: User Story 6 (RBAC) - **MVP Part 3**
6. **STOP and VALIDATE**: Test P1 user stories independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add P1 User Stories (1, 2, 6) → Test independently → Deploy/Demo (MVP!)
3. Add P2 User Stories (3, 5) → Test independently → Deploy/Demo
4. Add P3 User Story (7) → Test independently → Deploy/Demo
5. Polish Phase → Final validation and optimization

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Daily Pricing)
   - Developer B: User Story 2 (Quality Thresholds)
   - Developer C: User Story 6 (RBAC)
   - Developer D: User Story 4 (Reception Creation)
3. Stories complete and integrate independently

---

## Notes

- **[P]** tasks = different files, no dependencies
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Total Task Count: 90

- Setup: 7 tasks (T001-T007)
- Foundational: 11 tasks (T008-T018)
- User Stories: 62 tasks (T019-T080)
  - US1 (P1): 9 tasks (T019-T027)
  - US2 (P1): 8 tasks (T028-T035)
  - US3 (P2): 7 tasks (T036-T042)
  - US4 (P1): 10 tasks (T043-T052)
  - US5 (P2): 8 tasks (T053-T060)
  - US6 (P1): 7 tasks (T061-T067)
  - US7 (P3): 7 tasks (T068-T074)
- Polish: 10 tasks (T075-T090)
