# Feature Specification: Cacao Processing Batches & Laboratory Samples

**Feature Branch**: `004-cacao-processing-module`
**Created**: 2025-11-01
**Status**: Draft
**Input**: User description: "🧩 Feature Spec — Cacao Processing Batches & Laboratory Samples..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Laboratory Sample Management (Priority: P1)

As a lab technician, I want to create a laboratory sample when a new cacao reception arrives, track its drying process, and record the final quality results, so that the system can provide an early estimate of yield and quality for the main reception.

**Why this priority**: This provides immediate value by enabling early yield projections and quality assessment, which is critical for financial planning and inventory management, even before the main batch is processed.

**Independent Test**: This can be tested by creating a single reception, generating a lab sample for it, and completing the sample's lifecycle by entering results. The value is delivered when the parent reception's data is updated with the sample's findings.

**Acceptance Scenarios**:

1. **Given** a new cacao reception is created, **When** the user selects "Generate Laboratory Sample" and inputs the sample weight and estimated drying days, **Then** a new sample record is created, linked to the reception, and its status is set to "Drying".
2. **Given** a sample is in "Drying" status, **When** the estimated drying days have passed, **Then** its status changes to "Completed" and the system sends a notification to input the results.
3. **Given** a sample is "Completed", **When** a user inputs the dried sample weight and quality percentages (violetas, moho, basura), **Then** the parent reception's record is updated with this quality data and the sample's status is "Result Entered".

---

### User Story 2 - Batch Creation and Processing (Priority: P2)

As a plant operator, I want to group multiple wet cacao receptions into a single drying or fermentation batch, so that I can manage and track the entire processing lifecycle as one unit.

**Why this priority**: This is the core of the batch management workflow. It allows for efficient management of large quantities of cacao and is the foundation for tracking processing progress.

**Independent Test**: This can be tested by selecting several existing receptions and creating a new batch from them. The value is delivered when the batch appears on a dashboard with a clear progress indicator showing its expected completion date.

**Acceptance Scenarios**:

1. **Given** several wet cacao receptions exist, **When** an operator selects them and chooses to "Create Batch", **Then** the system creates a new batch record and calculates the total wet weight and the percentage contribution of each reception.
2. **Given** a new batch is created with a start date and estimated duration, **When** the batch is saved, **Then** the system calculates the `expected_completion_date` and displays a progress countdown on the dashboard.

---

### User Story 3 - Batch Result Input and Distribution (Priority: P3)

As a plant manager, I want to input the final total dried weight for a completed batch, so that the system automatically distributes this weight proportionally across all receptions included in that batch.

**Why this priority**: This completes the processing lifecycle and provides the final, accurate data for each reception. It automates a complex calculation, saving time and reducing errors.

**Independent Test**: This can be tested with a single completed batch. The user inputs the final dried weight, and the test passes if each reception within the batch is correctly updated with its proportional share of the dried weight.

**Acceptance Scenarios**:

1. **Given** a batch has reached its completion date, **When** a manager inputs the `total_sacos_70kg` and `remainder_kg`, **Then** the system calculates the `total_dried_weight`.
2. **Given** the `total_dried_weight` is calculated, **When** the user confirms the entry, **Then** the system calculates the proportional `dried_weight` for each reception in the batch and updates their records accordingly, and the batch status is marked "Completed".

---

### Edge Cases

- **Error Handling**: What happens if a user enters a non-numeric value for weights or percentages? The system should show a validation error.
- **Modification**: Can a reception be removed from a batch after it has been created? If so, under what conditions (e.g., only if the batch is "In progress")?
- **Data Integrity**: What happens if the total dried weight entered is greater than the total wet weight? The system should display a warning before proceeding.
- **Sample Failure**: What happens if a laboratory sample is lost or contaminated? The user should be able to mark the sample as "Failed" or "Cancelled" to remove it from the processing queue.

## Assumptions

- The system already has a concept of a "reception" that this module will build upon.
- User roles and permissions (e.g., "lab technician", "plant operator", "plant manager") are either pre-existing or will be implemented as part of this feature.
- A notification system exists or will be created to handle alerts for batches and samples nearing completion.


## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authorized users to create a drying, fermentation, or combined batch from one or more existing cacao receptions.
- **FR-002**: System MUST automatically calculate and store the total wet weight of a batch and the individual weight percentage of each reception within it.
- **FR-003**: System MUST display the progress of each batch, including the days remaining until the expected completion date.
- **FR-004**: Users MUST be able to input the final dried result for a completed batch, specified in 70kg sacks and a remainder in kg.
- **FR-005**: System MUST calculate the total dried weight and distribute it proportionally as `dried_weight` to each reception in the batch.
- **FR-006**: System MUST allow authorized users to generate a `Laboratorio de Muestras` (Laboratory Sample) from a parent cacao reception.
- **FR-007**: Users MUST be able to input quality results for a completed sample, including `dried_sample_kg` and percentages for `violetas`, `moho`, and `basura`.
- **FR-008**: System MUST update the parent reception's record with the quality data after the linked sample results are entered.
- **FR-009**: System MUST provide dashboard indicators or notifications for batches and samples that are nearing completion.
- **FR-010**: System MUST restrict the ability to create, modify, and complete batches and samples based on user roles (e.g., Plant Staff, Lab Staff, Managers).

### Key Entities *(include if feature involves data)*

- **Cacao Batch**: Represents a single drying and/or fermentation process. Key attributes include batch type, start date, duration, total wet weight, total dried weight, and status.
- **Batch Reception**: A linking entity that associates a specific reception with a Cacao Batch. It stores the reception's wet weight contribution, its percentage of the total, and its calculated share of the final dried weight.
- **Laboratory Sample**: Represents a small sample taken from a single reception for early quality analysis. Key attributes include the initial sample weight, drying duration, final dried weight, and resulting quality percentages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reduce the manual effort required to calculate and assign final dried weights to receptions by 100% through automated proportional distribution.
- **SC-002**: All active batches and samples on the dashboard MUST display a real-time progress indicator (e.g., days remaining).
- **SC-003**: The time taken for an operator to create a new batch with up to 10 receptions MUST be less than 5 minutes.
- **SC-004**: Improve the accuracy of yield projections by ensuring that at least 90% of new receptions have a laboratory sample created within 24 hours of arrival.
