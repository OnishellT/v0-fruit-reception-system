---
description: "Task list template for feature implementation"
---

# Tasks: Post-Reception Quality Evaluation (Café Seco)

**Input**: Design documents from `/specs/001-cafe-quality/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included for critical workflows as requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/` or `android/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create database migration script for calidad_cafe table in scripts/10-add-quality-cafe-table.sql
- [X] T002 Create TypeScript types for quality evaluation in lib/types/quality-cafe.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Run database migration to create calidad_cafe table in database
- [X] T004 Create quality evaluation server actions in lib/actions/quality-cafe.ts (createQualityEvaluation)
- [X] T005 Create quality evaluation server actions in lib/actions/quality-cafe.ts (updateQualityEvaluation)
- [X] T006 Create quality evaluation server actions in lib/actions/quality-cafe.ts (getQualityEvaluation)
- [X] T007 Create quality evaluation server actions in lib/actions/quality-cafe.ts (getQualityEvaluationWithReception)
- [X] T008 Add Zod validation schemas to lib/actions/quality-cafe.ts
- [X] T009 Add proper error handling to all quality server actions

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quality Registration Button (Priority: P1) 🎯 MVP

**Goal**: Display "Registrar Calidad" button only for Café Seco receptions in the receptions table

**Independent Test**: Can verify button visibility rules work correctly (visible for CAFÉ + Seco, hidden for other fruit types)

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] Test button visibility for Café Seco receptions in tests/test-quality-cafe.js
- [X] T011 [P] Test button is hidden for non-Café Seco receptions in tests/test-quality-cafe.js

### Implementation for User Story 1

- [X] T012 Create quality evaluation modal component in components/quality-evaluation-modal.tsx
- [X] T013 Update receptions table component to add conditional quality button in app/dashboard/reception/page.tsx
- [X] T014 Implement button visibility logic (CAFÉ + Seco only) in app/dashboard/reception/page.tsx
- [X] T015 Add modal state management in app/dashboard/reception/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Quality Data Entry (Priority: P1)

**Goal**: Enable administrators to input quality metrics (Violetas, Humedad, Moho) via modal form and save to database

**Independent Test**: Can complete quality registration workflow end-to-end and verify data persistence

### Tests for User Story 2

- [ ] T016 [P] Test modal opens when button clicked in tests/test-quality-cafe.js
- [ ] T017 [P] Test form fields are present and editable in tests/test-quality-cafe.js
- [ ] T018 Test quality data can be saved successfully in tests/test-quality-cafe.js
- [ ] T019 Test modal closes after successful save in tests/test-quality-cafe.js

### Implementation for User Story 2

- [ ] T020 Implement form fields in quality-evaluation-modal.tsx (Violetas, Humedad, Moho)
- [ ] T021 Add client-side validation with Zod in quality-evaluation-modal.tsx
- [ ] T022 Implement modal submit handler in quality-evaluation-modal.tsx
- [ ] T023 Connect modal to createQualityEvaluation server action
- [ ] T024 Add success feedback and error handling in quality-evaluation-modal.tsx
- [ ] T025 Implement modal close and cancel functionality in quality-evaluation-modal.tsx

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Data Persistence and Display (Priority: P1)

**Goal**: Show visual confirmation that quality data has been registered and display existing data correctly

**Independent Test**: Can verify UI updates correctly after saving quality data and across page reloads

### Tests for User Story 3

- [ ] T026 Test button label changes from "Registrar Calidad" to "Ver/Editar Calidad" in tests/test-quality-cafe.js
- [ ] T027 Test modal pre-fills with existing data on subsequent opens in tests/test-quality-cafe.js
- [ ] T028 Test data persists across page reloads in tests/test-quality-cafe.js
- [ ] T029 Test visual indicator shows quality data exists in tests/test-quality-cafe.js

### Implementation for User Story 3

- [ ] T030 Fetch quality data for each reception row in app/dashboard/reception/page.tsx
- [ ] T031 Update button labels based on quality data existence in app/dashboard/reception/page.tsx
- [ ] T032 Implement quality data check for button state in app/dashboard/reception/page.tsx
- [ ] T033 Add quality indicators to table display in app/dashboard/reception/page.tsx
- [ ] T034 Connect modal to updateQualityEvaluation server action for existing data

**Checkpoint**: At this point, User Stories 1, 2, and 3 should work together as a cohesive MVP

---

## Phase 6: User Story 4 - Permission Controls (Priority: P2)

**Goal**: Enforce role-based access to quality data (admins can edit, operators can view)

**Independent Test**: Can verify role-based permissions are enforced correctly for all users

### Tests for User Story 4

- [ ] T035 Test admin can edit existing quality data in tests/test-quality-cafe.js
- [ ] T036 Test operator sees read-only fields in tests/test-quality-cafe.js
- [ ] T037 Test operator cannot save changes in tests/test-quality-cafe.js
- [ ] T038 Test permission denied message displays for unauthorized users in tests/test-quality-cafe.js

### Implementation for User Story 4

- [ ] T039 Pass user role to modal component in app/dashboard/reception/page.tsx
- [ ] T040 Implement read-only mode for operators in quality-evaluation-modal.tsx
- [ ] T041 Add permission checks in updateQualityEvaluation server action
- [ ] T042 Add permission error messages in quality-evaluation-modal.tsx
- [ ] T043 Disable form fields when user is not admin in quality-evaluation-modal.tsx

**Checkpoint**: At this point, permissions should be properly enforced for all user types

---

## Phase 7: User Story 5 - Data Validation (Priority: P2)

**Goal**: Ensure quality data integrity through proper validation (0-100 range, required fields)

**Independent Test**: Can verify validation works correctly for all input scenarios

### Tests for User Story 5

- [ ] T044 Test validation prevents values less than 0 in tests/test-quality-cafe.js
- [ ] T045 Test validation prevents values greater than 100 in tests/test-quality-cafe.js
- [ ] T046 Test validation prevents empty required fields in tests/test-quality-cafe.js
- [ ] T047 Test validation errors display correctly in modal in tests/test-quality-cafe.js
- [ ] T048 Test form cannot be saved with invalid data in tests/test-quality-cafe.js

### Implementation for User Story 5

- [ ] T049 Add range validation (0-100) to client-side Zod schema in quality-evaluation-modal.tsx
- [ ] T050 Add range validation (0-100) to server-side Zod schema in lib/actions/quality-cafe.ts
- [ ] T051 Add required field validation to Zod schemas
- [ ] T052 Display validation error messages in modal in quality-evaluation-modal.tsx
- [ ] T053 Add inline field validation feedback in quality-evaluation-modal.tsx
- [ ] T054 Prevent form submission with invalid data in quality-evaluation-modal.tsx

**Checkpoint**: At this point, all validation should be working correctly

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T055 [P] Add quality evaluation tests to test suite in tests/test-quality-cafe.js
- [ ] T056 [P] Run all existing tests to ensure no regressions (9/9 CRUD tests)
- [ ] T057 [P] Update TypeScript strict mode compliance
- [ ] T058 [P] Add audit logging for quality operations
- [ ] T059 [P] Add loading states to modal component in quality-evaluation-modal.tsx
- [ ] T060 [P] Add responsive design support for mobile in quality-evaluation-modal.tsx
- [ ] T061 [P] Update documentation in docs/README.md
- [ ] T062 [P] Code cleanup and refactoring across quality components
- [ ] T063 [P] Performance optimization for quality data queries
- [ ] T064 [P] Final E2E testing across all user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Builds on US1 (modal exists)
- **User Story 3 (P1)**: Depends on User Story 2 (needs data to display)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent of US2/US3
- **User Story 5 (P2)**: Can start after User Story 2 (needs form to validate)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Database before server actions
- Server actions before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001, T002)
- All Foundational tasks marked [P] can run in parallel (T004, T005, T006, T007, T008, T009)
- User Story 1 tests (T010, T011) can run in parallel
- User Story 2 tests (T016, T017) can run in parallel
- User Story 1 and User Story 2 can be worked on in parallel by different developers
- User Story 4 (permissions) can start early since it doesn't depend on US2/US3

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Test button visibility for Café Seco receptions in tests/test-quality-cafe.js"
Task: "Test button is hidden for non-Café Seco receptions in tests/test-quality-cafe.js"

# Launch all components for User Story 1 together:
Task: "Create quality evaluation modal component in components/quality-evaluation-modal.tsx"
Task: "Update receptions table component to add conditional quality button in app/dashboard/reception/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Button visibility MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full CRUD for quality!)
4. Add User Story 3 → Test independently → Deploy/Demo (Visual feedback complete!)
5. Add User Story 4 → Test independently → Deploy/Demo (Security enforced!)
6. Add User Story 5 → Test independently → Deploy/Demo (Validation complete!)
7. Polish phase → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Button visibility)
   - Developer B: User Story 2 (Data entry)
   - Developer C: User Story 4 (Permissions)
3. Stories complete and integrate independently
4. Add User Story 3 (Display) - builds on US2
5. Add User Story 5 (Validation) - builds on US2

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Total Task Count: 64 tasks

- **Setup Phase**: 2 tasks
- **Foundational Phase**: 7 tasks
- **User Story 1**: 6 tasks (including 2 tests)
- **User Story 2**: 10 tasks (including 4 tests)
- **User Story 3**: 9 tasks (including 4 tests)
- **User Story 4**: 9 tasks (including 4 tests)
- **User Story 5**: 10 tasks (including 5 tests)
- **Polish Phase**: 10 tasks

## Independent Test Criteria

### User Story 1
- Button appears for CAFÉ + Seco receptions
- Button hidden for other fruit types
- Modal opens when clicked

### User Story 2
- Can input quality metrics
- Can save data successfully
- Data persists to database

### User Story 3
- Button label changes after saving
- Existing data displays correctly
- Data persists across page reloads

### User Story 4
- Admin can edit
- Operator sees read-only
- Permissions enforced correctly

### User Story 5
- Invalid values rejected
- Empty fields rejected
- Errors display clearly
