# Feature Specification: Weighted Discount Calculation and Visualization in Receptions

**Feature Branch**: `003-weight-discounts`
**Created**: 2025-10-31
**Status**: Draft
**Input**: User description: "Weighted Discount Calculation and Visualization in Receptions feature with automatic weight-based discounts based on quality thresholds"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Weight Discount Calculation (Priority: P1)

As a fruit quality evaluator, when I record quality data that exceeds defined thresholds, the system automatically calculates and applies the appropriate weight discounts to the reception total, showing me both the original and adjusted weights.

**Why this priority**: This is the core functionality that provides value by automating discount calculations based on quality metrics, reducing manual errors and providing transparency.

**Independent Test**: Can be tested by creating a reception with quality data above thresholds and verifying the correct discount calculations are applied and displayed.

**Acceptance Scenarios**:

1. **Given** a reception with Café fruit type and Moho quality value of 12%, **When** the pricing rule threshold for Moho is 10% with 5% discount, **Then** the system applies a 5% weight reduction to the total reception weight
2. **Given** a reception with multiple quality metrics exceeding thresholds, **When** the system processes the reception, **Then** it applies the sum of all applicable discounts to the total weight
3. **Given** a reception with all quality metrics within thresholds, **When** the system processes the reception, **Then** no discounts are applied and the final weight equals the original weight

---

### User Story 2 - Discount Breakdown Visualization (Priority: P1)

As a reception operator, I want to see a clear breakdown of how each quality metric contributed to the total weight discount, so I can understand why the final weight was reduced and explain this to suppliers.

**Why this priority**: Transparency is essential for business operations and supplier relationships. Understanding discount drivers builds trust and enables better decision-making.

**Independent Test**: Can be verified by viewing a reception with applied discounts and confirming the breakdown shows each metric's contribution accurately.

**Acceptance Scenarios**:

1. **Given** a reception with applied discounts, **When** I view the reception form, **Then** I see a "Desglose de Descuentos" section showing original weight, discount amount, and final weight
2. **Given** multiple quality metrics triggered discounts, **When** I expand the discount breakdown, **Then** I see each metric with its actual value, threshold, and resulting weight reduction
3. **Given** a reception with no discounts applied, **When** I view the discount section, **Then** I see zero discount amounts and original weight equals final weight

---

### User Story 3 - Admin Manual Adjustment (Priority: P2)

As an administrator, when reviewing reception data, I want to manually adjust discount percentages or final weights if necessary, so I can correct errors or handle special cases.

**Why this priority**: Provides operational flexibility for edge cases and exceptional circumstances while maintaining audit trails.

**Independent Test**: Can be tested by an admin editing a reception with discounts and modifying the final values, verifying the changes persist correctly.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** editing a reception with applied discounts, **Then** I can modify the final discounted total weight
2. **Given** I am a regular user, **When** viewing a reception with applied discounts, **Then** I cannot edit any discount-related fields
3. **Given** I manually adjust discount values, **When** saving the reception, **Then** the system records my changes and displays the updated totals

---

### User Story 4 - Dynamic Recalculation (Priority: P2)

As a reception operator, when I change the fruit type or quality evaluation data, I want the discount calculations to automatically update, so I always see accurate weight totals without manual recalculations.

**Why this priority**: Ensures data consistency and reduces user workload when reception details change during the entry process.

**Independent Test**: Can be verified by modifying quality data or fruit type in an editable reception and confirming discounts recalculate automatically.

**Acceptance Scenarios**:

1. **Given** an editable reception with applied discounts, **When** I change a quality evaluation value, **Then** the discount breakdown and final weight update automatically
2. **Given** an editable reception, **When** I change the fruit type, **Then** the system reapplies the appropriate pricing rules for the new fruit type
3. **Given** quality data changes from above to below threshold, **When** the system recalculates, **Then** the corresponding discount is removed from the total

---

### Edge Cases

- What happens when quality evaluation data is missing or incomplete for required metrics?
- How does system handle conflicting pricing rules or overlapping discount criteria?
- What happens when a fruit type has no active pricing rules configured?
- How are negative or zero weight values handled in discount calculations?
- What occurs when multiple administrators simultaneously edit discount values?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically calculate weight discounts based on quality evaluation data exceeding pricing rule thresholds
- **FR-002**: System MUST display original weight, total discount amount, and final weight in reception forms
- **FR-003**: System MUST provide expandable breakdown showing each quality metric's contribution to total discount
- **FR-004**: System MUST support multiple discount applications when multiple quality metrics exceed thresholds
- **FR-005**: System MUST restrict discount editing capabilities to administrator users only
- **FR-006**: System MUST automatically recalculate discounts when quality data or fruit type changes
- **FR-007**: System MUST persist original weight, discount details, and final weight data
- **FR-008**: System MUST handle decimal precision for weight calculations to two decimal places
- **FR-009**: System MUST validate that discount calculations never result in negative final weights
- **FR-010**: System MUST provide audit trail of discount calculations and manual adjustments

### Key Entities *(include if feature involves data)*

- **Reception Weight Discount**: Represents the calculated discount information for a fruit reception, including original weight, discount breakdown, and final adjusted weight
- **Discount Breakdown Item**: Individual quality metric contribution to total discount, storing the parameter, threshold, actual value, and calculated weight reduction
- **Pricing Rule Threshold**: Configuration defining when quality triggers apply and what discount percentage to use

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view complete discount breakdown information within 3 seconds of opening a reception
- **SC-002**: Automatic discount calculations complete in under 1 second for receptions with up to 10 quality metrics
- **SC-003**: 99% of discount calculations match expected results based on configured pricing rules
- **SC-004**: Manual adjustments by administrators are tracked with 100% audit completeness
- **SC-005**: User satisfaction score of 85% or higher for discount transparency and understandability
- **SC-006**: Reduction in support tickets related to weight calculation questions by 40%
