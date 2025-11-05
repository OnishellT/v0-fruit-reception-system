---

description: "Task list for Dynamic Quality-Based Pricing System implementation"
---

# Tasks: Dynamic Quality-Based Pricing System

**Input**: Design documents from `/specs/002-quality-pricing-discounts/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Review existing fruit reception system structure and identify integration points
- [ ] T002 Analyze existing database schema for receptions, quality evaluations, and fruit types
- [ ] T003 [P] Review current authentication and RBAC implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create database migrations for pricing_rules table
- [ ] T005 Create database migrations for discount_thresholds table
- [ ] T006 Create database migrations for pricing_calculations table
- [ ] T007 Add pricing_calculation_id foreign key to receptions table
- [ ] T008 [P] Set up Row Level Security (RLS) policies for all new tables
- [ ] T009 [P] Create Zod schemas for pricing rules and thresholds in lib/
- [ ] T010 Create TypeScript types for PricingRule, DiscountThreshold, PricingCalculation
- [ ] T011 Implement pricing calculation engine logic (server-side utility)
- [ ] T012 Create server actions base structure for pricing operations
- [ ] T013 Setup error handling and validation for pricing operations

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure Quality-Based Pricing Rules (Priority: P1) 🎯 MVP

**Goal**: Administrators can configure discount thresholds for each fruit type and quality metric

**Independent Test**: Access pricing configuration interface, set up thresholds for a fruit type, verify thresholds are saved and retrievable

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create PricingRule model and service in lib/
- [ ] T015 [P] [US1] Create DiscountThreshold model and service in lib/
- [ ] T016 [US1] Implement server action: getPricingRules(fruitType: string)
- [ ] T017 [US1] Implement server action: updatePricingRules(rules: PricingRuleInput)
- [ ] T018 [US1] Implement server action: createDiscountThreshold(threshold: ThresholdInput)
- [ ] T019 [US1] Implement server action: updateDiscountThreshold(id: string, threshold: ThresholdInput)
- [ ] T020 [US1] Implement server action: deleteDiscountThreshold(id: string)
- [ ] T021 [US1] Create admin configuration page component in app/dashboard/pricing/
- [ ] T022 [US1] Create fruit type selection interface
- [ ] T023 [US1] Create threshold configuration form components
- [ ] T024 [US1] Implement enable/disable toggle for quality-based pricing per fruit type
- [ ] T025 [US1] Add form validation with Zod schemas
- [ ] T026 [US1] Add loading states and error handling in UI
- [ ] T027 [US1] Add Spanish localization for all pricing configuration text

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Process Reception with Quality Evaluation (Priority: P1) 🎯 MVP

**Goal**: System automatically calculates final payable amount when saving receptions with quality evaluations

**Independent Test**: Create a reception with quality evaluation data, verify correct discount calculation and transparent pricing breakdown

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [P] [US2] E2E test: Configure thresholds then save reception with quality evaluation in tests/
- [ ] T029 [P] [US2] E2E test: Verify pricing breakdown displays correctly in tests/

### Implementation for User Story 2

- [ ] T030 [US2] Implement server action: calculateReceptionPricing(receptionData: ReceptionInput)
- [ ] T031 [US2] Implement server action: saveReceptionWithPricing(receptionData: ReceptionInput)
- [ ] T032 [US2] Create pricing calculation utility that evaluates quality metrics against thresholds
- [ ] T033 [US2] Modify existing reception form to include pricing calculation step
- [ ] T034 [US2] Create pricing breakdown display component
- [ ] T035 [US2] Add display for base value, individual discounts, and final total
- [ ] T036 [US2] Validate required quality metrics before allowing reception save
- [ ] T037 [US2] Handle edge case: quality values outside threshold ranges
- [ ] T038 [US2] Handle edge case: quality-based pricing disabled for fruit type
- [ ] T039 [US2] Add audit logging for pricing calculations
- [ ] T040 [US2] Integrate with existing reception workflow

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Review Pricing History (Priority: P2)

**Goal**: Administrators can review historical receptions with pricing details, verifying that pricing changes don't affect existing records

**Independent Test**: Review historical receptions after making pricing changes, verify historical pricing details remain unchanged

### Tests for User Story 3

- [ ] T041 [P] [US3] E2E test: Modify pricing thresholds, verify existing receptions unchanged in tests/

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create historical pricing data retrieval service
- [ ] T043 [US3] Implement server action: getReceptionPricingHistory(receptionId: string)
- [ ] T044 [US3] Create historical pricing display component
- [ ] T045 [US3] Display original base price, discounts, and final total from time of reception
- [ ] T046 [US3] Add comparison view showing historical vs current pricing rules
- [ ] T047 [US3] Add date-based sorting and filtering for receptions
- [ ] T048 [US3] Implement audit trail showing when pricing calculations were performed

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Adjust Pricing Rules Based on Performance (Priority: P3)

**Goal**: Administrators can modify discount thresholds based on market conditions, with changes only affecting new receptions

**Independent Test**: Modify threshold values, create new reception, verify only new receptions use updated thresholds

### Tests for User Story 4

- [ ] T049 [P] [US4] E2E test: Modify thresholds and verify only new receptions affected in tests/

### Implementation for User Story 4

- [ ] T050 [P] [US4] Create pricing rules version/history tracking
- [ ] T051 [US4] Implement server action: updatePricingRulesWithVersioning(rules: PricingRuleInput)
- [ ] T052 [US4] Add validation to prevent unrealistic pricing scenarios
- [ ] T053 [US4] Create threshold comparison interface (old vs new values)
- [ ] T054 [US4] Add confirmation dialog for pricing rule changes
- [ ] T055 [US4] Create rollback mechanism for pricing rule changes
- [ ] T056 [US4] Add documentation/prompt when making significant pricing adjustments

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T057 [P] Add comprehensive E2E tests for all pricing workflows in tests/
- [ ] T058 [P] Performance optimization: index database tables for pricing queries
- [ ] T059 [P] Add unit tests for pricing calculation engine in tests/
- [ ] T060 Add documentation for pricing configuration in docs/
- [ ] T061 Create quickstart guide for administrators in docs/
- [ ] T062 Code cleanup and refactoring across all pricing components
- [ ] T063 Add error boundaries and improved error messages
- [ ] T064 Optimize pricing calculations for concurrent processing
- [ ] T065 Add export functionality for pricing reports
- [ ] T066 Run cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] T067 Verify all Spanish localization is complete and accurate
- [ ] T068 Final integration testing with existing reception workflow
- [ ] T069 Update README.md with pricing feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2/US3 but independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Database migrations before models
- Models before services
- Services before server actions
- Server actions before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - User Story 1 can start immediately
  - User Story 2 can start immediately (uses US1 components)
  - User Stories 3 and 4 can start after US1/US2 foundation
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create PricingRule model and service in lib/"
Task: "Create DiscountThreshold model and service in lib/"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test User Stories 1 + 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3 & 4 (can work in parallel)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence