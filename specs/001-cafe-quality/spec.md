# Feature Specification: Post-Reception Quality Evaluation (Café Seco)

**Feature Branch**: `001-cafe-quality`
**Created**: 2025-10-31
**Status**: Draft

## Purpose

To allow authorized users to record and manage quality attributes for Café Seco receptions after they have been registered in the system. This ensures quality traceability, supports pricing adjustments, and maintains consistency in post-reception processes.

## Functional Overview

Once a Café Seco reception is saved, a new "Registrar Calidad" button becomes visible in the corresponding row of the Recepciones table.

Clicking the button opens a Quality Evaluation modal (or form view) where the user can input or edit quality data.

Only users with Admin privileges can modify existing records; regular users can only view them.

The quality values are stored as percentages (0–100) and linked directly to the corresponding recepcion_id.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quality Registration Button (Priority: P1)

**As a** farm operator or administrator
**I want** to see a "Registrar Calidad" button only for Café Seco receptions
**So that** I can easily access the quality evaluation form for those specific receptions

**Why this priority**: This is the entry point to the feature and must work reliably to avoid user confusion.

**Independent Test**: Can verify button visibility rules (visible for Café Seco, hidden for other fruit types) without any quality data.

**Acceptance Scenarios**:

1. **Given** a reception record with fruit type "CAFÉ" and subtype "Seco", **When** viewing the receptions table, **Then** the "Registrar Calidad" button is visible
2. **Given** a reception record with fruit type "CAFÉ" and subtype "Arábica", **When** viewing the receptions table, **Then** the "Registrar Calidad" button is NOT visible
3. **Given** a reception record with fruit type "CACAO", **When** viewing the receptions table, **Then** the "Registrar Calidad" button is NOT visible

---

### User Story 2 - Quality Data Entry (Priority: P1)

**As an** administrator
**I want** to input quality metrics (Violetas, Humedad, Moho) via a modal form
**So that** I can record the quality assessment for each Café Seco reception

**Why this priority**: Core functionality - allows data entry which is the primary value of the feature.

**Independent Test**: Can complete quality registration workflow end-to-end and verify data persistence.

**Acceptance Scenarios**:

1. **Given** I'm on the receptions page, **When** I click "Registrar Calidad" on a Café Seco reception, **Then** a modal opens with title "Evaluación de Calidad — Café Seco"
2. **Given** the quality evaluation modal is open, **When** I enter valid values (0-100 for Violetas, Humedad, Moho) and click Guardar, **Then** the data is saved and the modal closes
3. **Given** the quality evaluation modal is open, **When** I click Cancelar, **Then** the modal closes without saving changes

---

### User Story 3 - Data Persistence and Display (Priority: P1)

**As a** user (admin or operator)
**I want** to see visual confirmation that quality data has been registered
**So that** I can quickly identify which receptions have completed quality evaluation

**Why this priority**: Essential feedback loop - users need to know the state of their data.

**Independent Test**: Can verify UI updates correctly after saving quality data and across page reloads.

**Acceptance Scenarios**:

1. **Given** quality data has been saved for a reception, **When** viewing the receptions table, **Then** the button label changes from "Registrar Calidad" to "Ver Calidad"
2. **Given** an admin is viewing a reception with existing quality data, **When** clicking the button, **Then** the modal opens with pre-filled editable fields
3. **Given** a non-admin user is viewing a reception with existing quality data, **When** clicking the button, **Then** the modal opens with read-only fields

---

### User Story 4 - Permission Controls (Priority: P2)

**As a** system administrator
**I want** to enforce role-based access to quality data modification
**So that** only authorized personnel can edit quality records while others can view them

**Why this priority**: Important for data integrity and compliance, but read-only access is acceptable for operations.

**Acceptance Scenarios**:

1. **Given** I have admin role, **When** opening a quality evaluation modal with existing data, **Then** all fields are editable
2. **Given** I have operator role, **When** opening a quality evaluation modal with existing data, **Then** all fields are read-only
3. **Given** I have operator role, **When** attempting to modify quality data, **Then** changes are rejected with an appropriate message

---

### User Story 5 - Data Validation (Priority: P2)

**As a** system administrator
**I want** to ensure quality data integrity through proper validation
**So that** invalid data cannot corrupt the system or affect downstream processes

**Why this priority**: Critical for data quality and system reliability.

**Acceptance Scenarios**:

1. **Given** I'm entering quality data, **When** I enter a value less than 0, **Then** the system shows an error and prevents saving
2. **Given** I'm entering quality data, **When** I enter a value greater than 100, **Then** the system shows an error and prevents saving
3. **Given** I'm entering quality data, **When** I leave required fields empty, **Then** the system shows an error and prevents saving

### Edge Cases

- What happens when a reception is deleted after quality data is recorded?
- How does the system handle concurrent editing by multiple admins?
- What validation messages should be shown for invalid input?
- How should the system respond if the database operation fails during save?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display "Registrar Calidad" button only for receptions with fruit type "CAFÉ" and subtype "Seco"
- **FR-002**: System MUST open quality evaluation modal when the button is clicked
- **FR-003**: System MUST validate that quality metric values are between 0 and 100 (inclusive)
- **FR-004**: System MUST save quality data to the database with proper foreign key relationship to reception
- **FR-005**: System MUST enforce role-based permissions (admins can edit, non-admins view-only)
- **FR-006**: System MUST show visual indicator in receptions table when quality data exists
- **FR-007**: System MUST allow admins to update existing quality records
- **FR-008**: System MUST maintain audit trail of quality data modifications (created_by, updated_by, timestamps)

### Key Entities

- **calidad_cafe**: Table storing quality evaluation data
  - Fields: id, recepcion_id (FK), violetas, humedad, moho, created_by (FK to users), updated_by (FK to users), created_at, updated_at
  - Relationships: belongs to recepciones, created/updated by users

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete quality registration for a Café Seco reception in under 2 minutes
- **SC-002**: Button visibility rules work correctly for 100% of reception records (visible only for Café Seco)
- **SC-003**: 95% of quality data entries pass validation on first attempt
- **SC-004**: Role-based permissions enforced correctly for all users (100% accuracy)
- **SC-005**: Quality data persists correctly and displays accurately across page reloads

## UI/UX Specification

### Button Behavior

| Condition | Visibility | Label | Action |
|-----------|------------|-------|--------|
| Fruit type = Café Seco and no quality data | ✅ Visible | "Registrar Calidad" | Opens the quality modal |
| Fruit type ≠ Café Seco | 🚫 Hidden | — | — |
| Quality data already registered (admin) | ✅ Visible | "Editar Calidad" | Opens modal in edit mode |
| Quality data already registered (non-admin) | ✅ Visible | "Ver Calidad" | Opens modal in read-only mode |

### Modal / Sub-Form Layout

**Title**: Evaluación de Calidad — Café Seco

**Fields**:

| Field | Type | Unit | Validation | Description |
|-------|------|------|------------|-------------|
| Violetas | Number Input | % | 0–100 | Porcentaje de granos violetas presentes en el lote. |
| Humedad | Number Input | % | 0–100 | Nivel de humedad promedio del lote. |
| Moho | Number Input | % | 0–100 | Porcentaje de granos afectados por moho. |

**Buttons inside modal**:
- Guardar → saves or updates quality data
- Cancelar → closes modal without changes

### Additional Behavior

- If quality data already exists:
  - Admins see editable fields
  - Non-admin users see fields in read-only mode
- Upon saving, the modal closes and the table row for that reception updates (e.g., shows a ✓ icon or "Calidad registrada")

## Workflow Example

1. Reception of Café Seco is registered (e.g., 4 sacos, 453 kg)
2. System saves record in recepciones
3. In the receptions list, the user sees a button: "Registrar Calidad"
4. User clicks it → modal opens with empty fields for Violetas, Humedad, and Moho
5. User enters values and saves
6. Row updates visually to indicate quality data exists
7. Admin users can later reopen the modal to adjust or correct values

## Future Extension

This data will later integrate with a price adjustment module:
- Each percentage value (violetas, humedad, moho) will represent a discount factor in the final price per kilogram
- The discount logic will be configurable in the Admin Panel → Parámetros de Calidad section
- Current implementation should prepare for this integration (proper data structure, validations)
