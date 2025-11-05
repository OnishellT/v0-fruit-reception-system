# Feature Specification: Cash Point-of-Sale Reception System

**Feature Branch**: `005-cash-pos-system`
**Created**: 2025-11-05
**Status**: Draft
**Input**: User description: Cash POS Receptions feature with detailed implementation specifications

## User Scenarios & Testing

### User Story 1 - Daily Pricing Setup (Priority: P1)

As an Admin user, I need to set daily prices per fruit type so that operators can create receptions with the correct pricing for each day.

**Why this priority**: Without daily prices, no receptions can be created. This is the foundation that enables all cash reception workflows.

**Independent Test**: Admin can set a price for Café at RD$ 95.00 for today's date, and the system stores it as the active price for that date.

**Acceptance Scenarios**:

1. **Given** I am an Admin, **When** I set a price for Cacao at RD$ 95.00 for today's date, **Then** the system stores this price and displays it as active for future receptions.

2. **Given** I am an Admin, **When** I update tomorrow's price for Miel, **Then** today's receptions remain unchanged with their original price snapshot, while tomorrow's receptions will use the new price.

3. **Given** I am an Admin viewing daily prices, **When** I see a list of prices by date and fruit type, **Then** I can identify which prices are active and which are historical.

---

### User Story 2 - Quality Threshold Configuration (Priority: P1)

As an Admin, I need to configure quality thresholds per fruit type so that the system can automatically calculate discounts when quality measurements exceed acceptable levels.

**Why this priority**: Quality thresholds drive the discount calculation engine, which directly affects final payment amounts. This is essential for accurate payment processing.

**Independent Test**: Admin can configure a Humidity threshold of 30% for Café, and when an operator enters 40% humidity, the system applies a 10% discount.

**Acceptance Scenarios**:

1. **Given** I am an Admin, **When** I set a Humidity threshold of 30% for Café and enable this metric, **Then** the system uses this threshold to calculate discounts.

2. **Given** I am an Admin, **When** I disable the Moho threshold for a fruit type, **Then** Moho measurements are hidden from operator forms and excluded from discount calculations.

3. **Given** I am an Admin, **When** I adjust threshold percentages, **Then** only future receptions are affected; existing receptions retain their original discount breakdown.

---

### User Story 3 - Customer Registration (Priority: P2)

As an Operator, I need to register cash customers with their name and national ID so that I can associate receptions with the correct customer for invoicing.

**Why this priority**: Customer data is required for creating receptions and generating invoices. While essential, it's a simpler CRUD operation compared to pricing and discounting.

**Independent Test**: Operator can create a new customer with name "Juan Pérez" and cédula "001-0123456-7", and this customer appears in the customer selection dropdown for receptions.

**Acceptance Scenarios**:

1. **Given** I am an Operator, **When** I create a customer with complete information, **Then** the customer is saved and available for selection in reception forms.

2. **Given** I am an Operator, **When** I search for an existing customer by name or national ID, **Then** matching customers are displayed for quick selection.

---

### User Story 4 - Cash Reception Creation (Priority: P1)

As an Operator, I need to create cash receptions by entering weight and quality measurements so that customers receive immediate payment for their fruit.

**Why this priority**: This is the core transaction that generates revenue. Operators must be able to complete receptions quickly and accurately.

**Independent Test**: Operator can create a Café reception with 200kg weight and quality measurements, see live discount calculations, and save the reception with a finalized amount.

**Acceptance Scenarios**:

1. **Given** I am an Operator, **When** I create a reception with 200kg of Café where all quality measurements are below thresholds, **Then** no discount is applied, and the gross amount equals the net amount.

2. **Given** I am an Operator, **When** I enter Humidity of 40% with a 30% threshold, **Then** the system displays a 10% discount in real-time and calculates the final weight and amount.

3. **Given** I am an Operator, **When** I attempt to create a reception without a price set for that date, **Then** the system blocks creation and shows a clear error message indicating the admin must set the price first.

4. **Given** I am an Operator, **When** I enter quality measurements that would create a combined discount over 100%, **Then** the system caps the discount at 100% and shows a warning.

---

### User Story 5 - Invoice Generation and Printing (Priority: P2)

As an Operator, I need to generate a printable invoice for each reception so that customers have documentation of the transaction and discount details.

**Why this priority**: Customers require invoices for their records, and transparent discount breakdowns build trust in the pricing system.

**Independent Test**: Operator can view a reception and print an invoice showing original weight, detailed discount breakdown, final weight, and total amount due.

**Acceptance Scenarios**:

1. **Given** I am viewing a completed reception, **When** I click Print Invoice, **Then** a formatted document opens showing customer details, fruit type, original weight, discount breakdown by metric, final weight, and total amount.

2. **Given** I am viewing an invoice, **When** I examine the discount section, **Then** I can see exactly which metrics exceeded thresholds, by how much, and the weight deduction for each.

---

### User Story 6 - Role-Based Access Control (Priority: P1)

As a system administrator, I need to enforce role-based permissions so that only authorized users can perform sensitive operations like setting prices and thresholds.

**Why this priority**: Financial data integrity and security are critical. Only admins should control pricing, while operators focus on reception data entry.

**Independent Test**: An Operator cannot access the daily pricing interface, and attempts to set prices result in an access denied message.

**Acceptance Scenarios**:

1. **Given** I am an Operator, **When** I attempt to access the daily pricing page, **Then** the system denies access and shows an appropriate error message.

2. **Given** I am an Admin, **When** I set user roles, **Then** users with Operator role can create receptions and customers but cannot modify prices or thresholds.

3. **Given** I am a Viewer, **When** I access the cash reception system, **Then** I can view all data but cannot create or modify any records.

---

### User Story 7 - Reception Editing (Priority: P3)

As an Operator or Admin, I need to edit existing receptions to correct data entry errors while preserving price snapshots and recalculating discounts appropriately.

**Why this priority**: Data entry errors happen, and the system must support corrections. However, price snapshots must remain immutable to maintain financial integrity.

**Independent Test**: Operator can edit quality measurements on a past reception, and the system recalculates discounts based on new values while keeping the original price.

**Acceptance Scenarios**:

1. **Given** I am editing a reception from yesterday, **When** I change the humidity value from 35% to 40%, **Then** the system recalculates the discount and final amount but keeps the original price per kg snapshot.

2. **Given** I am editing a reception, **When** I change the weight, **Then** the system recalculates all amounts and discount weights proportionally.

---

### Edge Cases

- **Missing Price**: What happens when an operator tries to create a reception for a date/fruit combination without a set price? **System blocks creation and shows clear error message requiring admin to set price first.**

- **Multiple Active Prices**: What happens if multiple prices exist for the same date and fruit? **System uses the latest active price based on timestamp.**

- **Zero or Negative Final Weight**: How does the system handle quality measurements that would result in negative final weight? **System blocks save and shows error requiring corrected inputs.**

- **Disabled Fruit Types**: What happens when a fruit type is disabled? **Fruit type is hidden from operator forms, and existing receptions remain readable.**

- **No Quality Measurements**: How are receptions handled when no quality measurements are entered? **System treats missing measurements as null/zero and applies no discount.**

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide separate cash reception domain isolated from regular reception system with dedicated tables, UI routes, and data models.

- **FR-002**: System MUST support three user roles (Admin, Operator, Viewer) with appropriate RBAC enforcement through row-level security policies.

- **FR-003**: System MUST allow Admin users to set daily prices per fruit type with date association, where each price is timestamped and can be activated/deactivated.

- **FR-004**: System MUST snapshot the active price at the time of reception creation, making this price immutable for that reception regardless of future price changes.

- **FR-005**: System MUST allow Admin users to configure quality thresholds per fruit type, where each threshold includes a metric name, percentage value, and enabled/disabled status.

- **FR-006**: System MUST calculate discounts using the "excess over threshold" rule: for each enabled metric, if measured value exceeds threshold, discount only the excess percentage from total weight.

- **FR-007**: System MUST combine all metric discounts by summing excess percentages, then clamp the total discount to a maximum of 100% of original weight.

- **FR-008**: System MUST compute and display in real-time: discount percentage, discount weight in kg, final weight after discounts, gross amount (original weight × price), and net amount (final weight × price).

- **FR-009**: System MUST provide a detailed discount breakdown showing, for each metric: threshold value, actual measured value, percentage applied, and weight deduction.

- **FR-010**: System MUST support cash customer registration with name and national ID (cédula), storing creation timestamp and user ID.

- **FR-011**: System MUST support four fruit types (Café, Cacao, Miel, Cocos) with extensible design allowing additional fruit types without schema changes.

- **FR-012**: System MUST provide reception creation workflow accepting: fruit type, reception date (default: today), customer selection, container count, total weight, and quality measurements (humidity, moho, violetas).

- **FR-013**: System MUST generate printable invoices showing: customer information, original weight, per-metric discount breakdown, final weight, price per kg snapshot, gross amount, net amount, and signature lines.

- **FR-014**: System MUST provide reception management interface with list view (filterable by date, fruit, customer) and create/edit/view actions.

- **FR-015**: System MUST enforce data validation: block save if final weight would be zero or negative, warn if combined discount exceeds 100%, and block creation if no price exists for the date/fruit combination.

- **FR-016**: System MUST support fruit type enabling/disabling, where disabled types are hidden from operator forms but historical data remains accessible.

- **FR-017**: System MUST maintain audit trail with creation timestamp, user ID, and modification history for all cash entities.

### Key Entities

- **Cash Customer**: Represents individuals selling fruit for cash payment. Contains name, national ID (cédula), creation metadata, and created-by reference. Used for invoice generation and reception association.

- **Cash Fruit Type**: Catalog of fruit types supported in cash receptions. Contains code, name, enabled status, and creation metadata. Serves as the primary categorization for receptions and pricing.

- **Daily Price**: Historical record of per-kg prices set by admins for specific fruit types on specific dates. Contains fruit type reference, date, price value, active status, and creation metadata. Enables non-retroactive pricing with snapshot functionality.

- **Quality Threshold**: Configurable quality standards per fruit type. Contains fruit type reference, metric name (e.g., humidity, moho), threshold percentage, and enabled status. Drives automatic discount calculations by defining acceptable quality levels.

- **Cash Reception**: Core transaction record representing a single fruit reception. Contains fruit type, customer, reception date, containers count, original weight, price snapshot, quality measurements, calculated discounts (percentage, weight, final), financial totals (gross, net), and detailed discount breakdown. Immutable price snapshot ensures financial consistency.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Operators can complete a cash reception entry (weight + quality measurements) in under 3 minutes, including customer selection and form review.

- **SC-002**: System accurately calculates discounts with 100% precision, where discount weight = original weight × (sum of excess percentages / 100), capped at 100%.

- **SC-003**: Invoice generation completes in under 5 seconds and displays complete discount breakdown with per-metric details clearly presented.

- **SC-004**: RBAC enforcement works flawlessly with zero unauthorized access attempts successful across all role-restricted operations (price setting, threshold configuration, reception editing).

- **SC-005**: Price snapshotting maintains 100% data integrity - zero instances where past receptions are affected by subsequent price changes.

- **SC-006**: Admin users can configure daily prices and quality thresholds through an intuitive interface requiring no training or documentation.

- **SC-007**: System handles edge cases gracefully with appropriate user feedback - missing prices, excessive discounts, negative final weights all show clear error messages and prevent data corruption.

- **SC-008**: The cash reception system operates independently from the regular reception system with zero data leakage or cross-contamination.

- **SC-009**: Support for four fruit types (Café, Cacao, Miel, Cocos) with ability to add new fruit types through configuration without code changes.

- **SC-010**: Quality threshold changes affect only future receptions; existing receptions retain original discount calculations and breakdowns.

## Assumptions

- **Data Retention**: Cash reception data follows the same retention policies as the regular reception system (7 years for financial records).

- **Performance**: System handles up to 50 concurrent reception entries during peak morning hours without performance degradation.

- **Currency**: All prices are in Dominican Pesos (RD$) with 4 decimal precision for per-kg pricing and 3 decimal precision for weight measurements.

- **Timezone**: Reception dates use local timezone with UTC storage, allowing accurate daily price lookups by local date.

- **Printer Support**: Invoices are optimized for standard 8.5"×11" printing with browser print dialog support.

- **Quality Metrics**: Standard metrics (Humedad, Moho, Violetas) are sufficient for all fruit types; custom metrics can be added per fruit through threshold configuration.

- **User Management**: User roles are managed through existing authentication system with custom claims for role assignment.

- **Backup and Recovery**: Cash reception data follows the same backup and recovery procedures as the main reception system.

- **Reporting**: Daily summary reports showing total receptions, total weight, and total amount by fruit type are derived from reception data and don't require separate storage.

- **Multi-tenancy**: System assumes single-tenant deployment; cash receptions are organization-wide accessible based on user role, not isolated by organization unit.

