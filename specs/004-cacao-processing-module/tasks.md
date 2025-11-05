# Tasks: Cacao Processing Batches & Laboratory Samples

**Input**: Design documents from `/specs/004-cacao-processing-module/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `components/`, `lib/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Supabase migration script for new tables in `scripts/20-cacao-processing-module.sql`
- [x] T002 [P] Define Zod schemas for new entities in `lib/schemas/cacao.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create types for new entities from Zod schemas in `lib/types/cacao.ts`
- [x] T004 [P] Implement Supabase client functions for new tables in `lib/supabase/cacao.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Laboratory Sample Management (Priority: P1) 🎯 MVP

**Goal**: As a lab technician, I want to create a laboratory sample when a new cacao reception arrives, track its drying process, and record the final quality results, so that the system can provide an early estimate of yield and quality for the main reception.

**Independent Test**: This can be tested by creating a single reception, generating a lab sample for it, and completing the sample's lifecycle by entering results. The value is delivered when the parent reception's data is updated with the sample's findings.

### Implementation for User Story 1

- [x] T005 [US1] Create a form for creating a new laboratory sample in `components/create-lab-sample-form.tsx`
- [x] T006 [US1] Create a dialog for the lab sample form in `components/create-lab-sample-dialog.tsx`
- [x] T007 [US1] Implement the API endpoint for creating a new laboratory sample in `app/api/receptions/[receptionId]/samples/route.ts`
- [x] T008 [US1] Create a form for updating a laboratory sample with quality results in `components/update-lab-sample-form.tsx`
- [x] T009 [US1] Create a dialog for the lab sample update form in `components/update-lab-sample-dialog.tsx`
- [x] T010 [US1] Implement the API endpoint for updating a laboratory sample in `app/api/samples/[sampleId]/route.ts`
- [x] T011 [US1] Create a component to display laboratory sample details in `components/lab-sample-details.tsx`
- [x] T012 [US1] Implement the API endpoint for getting a single laboratory sample in `app/api/samples/[sampleId]/route.ts`
- [x] T013 [US1] Implement the API endpoint for getting all laboratory samples for a reception in `app/api/receptions/[receptionId]/samples/route.ts`
- [x] T014 [US1] Create a component to display a list of laboratory samples in `components/lab-samples-list.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Batch Creation and Processing (Priority: P2)

**Goal**: As a plant operator, I want to group multiple wet cacao receptions into a single drying or fermentation batch, so that I can manage and track the entire processing lifecycle as one unit.

**Independent Test**: This can be tested by selecting several existing receptions and creating a new batch from them. The value is delivered when the batch appears on a dashboard with a clear progress indicator showing its expected completion date.

### Implementation for User Story 2

- [x] T015 [US2] Create a form for creating a new cacao batch in `components/create-batch-form.tsx`
- [x] T016 [US2] Create a dialog for the batch creation form in `components/create-batch-dialog.tsx`
- [x] T017 [US2] Implement the API endpoint for creating a new cacao batch in `app/api/batches/route.ts`
- [x] T018 [US2] Create a component to display cacao batch details in `components/batch-details.tsx`
- [x] T019 [US2] Implement the API endpoint for getting a single cacao batch in `app/api/batches/[batchId]/route.ts`
- [x] T020 [US2] Implement the API endpoint for getting all cacao batches in `app/api/batches/route.ts`
- [x] T021 [US2] Create a component to display a list of cacao batches in `components/batches-list.tsx`
- [x] T022 [US2] Create a dashboard component to display batch progress in `components/batch-progress-dashboard.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Batch Result Input and Distribution (Priority: P3)

**Goal**: As a plant manager, I want to input the final total dried weight for a completed batch, so that the system automatically distributes this weight proportionally across all receptions included in that batch.

**Independent Test**: This can be tested with a single completed batch. The user inputs the final dried weight, and the test passes if each reception within the batch is correctly updated with its proportional share of the dried weight.

### Implementation for User Story 3

- [x] T023 [US3] Create a form for updating a cacao batch with final dried weight in `components/update-batch-form.tsx`
- [x] T024 [US3] Create a dialog for the batch update form in `components/update-batch-dialog.tsx`
- [x] T025 [US3] Implement the API endpoint for updating a cacao batch in `app/api/batches/[batchId]/route.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T026 [P] Documentation updates in `docs/`
- [x] T027 Code cleanup and refactoring
- [x] T028 Performance optimization across all stories
- [x] T029 Security hardening
- [x] T030 Run quickstart.md validation

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on User Story 2

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all API endpoints for User Story 1 together:
Task: "Implement the API endpoint for creating a new laboratory sample in app/api/receptions/[receptionId]/samples/route.ts"
Task: "Implement the API endpoint for updating a laboratory sample in app/api/samples/[sampleId]/route.ts"
Task: "Implement the API endpoint for getting a single laboratory sample in app/api/samples/[sampleId]/route.ts"
Task: "Implement the API endpoint for getting all laboratory samples for a reception in app/api/receptions/[receptionId]/samples/route.ts"

# Launch all components for User Story 1 together:
Task: "Create a form for creating a new laboratory sample in components/create-lab-sample-form.tsx"
Task: "Create a dialog for the lab sample form in components/create-lab-sample-dialog.tsx"
Task: "Create a form for updating a laboratory sample with quality results in components/update-lab-sample-form.tsx"
Task: "Create a dialog for the lab sample update form in components/update-lab-sample-dialog.tsx"
Task: "Create a component to display laboratory sample details in components/lab-sample-details.tsx"
Task: "Create a component to display a list of laboratory samples in components/lab-samples-list.tsx"
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
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
