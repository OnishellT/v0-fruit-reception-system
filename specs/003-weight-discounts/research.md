# Research Findings: Weighted Discount Calculation and Visualization

**Date**: 2025-10-31
**Feature**: Weighted Discount Calculation and Visualization in Receptions

## Existing System Analysis

### Database Schema Overview

#### Core Tables Structure
- **receptions**: Main reception data with `total_containers`, `fruit_type_id`, and `pricing_calculation_id` references
- **calidad_cafe**: Quality evaluation data for coffee (Violetas, Humedad, Moho as percentages 0-100)
- **pricing_rules**: Fruit type-based pricing configuration (supports CAFÉ, CACAO, MIEL, COCOS)
- **discount_thresholds**: Quality-based discount thresholds with percentage discounts
- **pricing_calculations**: Immutable calculation records with JSONB breakdown data

#### Quality Evaluation System
Currently supports coffee quality metrics:
- **Violetas** (0-100%): Purple grain percentage
- **Humedad** (0-100%): Moisture level
- **Moho** (0-100%): Mold percentage

### Pricing System Architecture

#### Current Calculation Flow
1. Base price calculation: `gross_value = base_price_per_kg × total_weight`
2. Quality discount application based on threshold ranges
3. Final total: `final_total = gross_value - total_discount_amount`

#### Pricing Calculation Storage
- Immutable records in `pricing_calculations` table
- JSONB `calculation_data` field stores detailed breakdown
- Complete audit trail with timestamps and user attribution

### Reception Form Architecture

#### Component Structure
- **reception-form.tsx**: Client component with React state management
- **Form Fields**: Provider, Driver, Fruit Type, Truck Plate, Containers, Notes
- **Mobile Support**: Custom numeric keypad, responsive layout toggle
- **State Management**: Local React state with useState hooks

#### Server Actions Integration
- `createReception()` / `updateReception()` in `/lib/actions/reception.ts`
- `createReceptionWithPricing()` in `/lib/actions/reception-with-pricing.ts`
- Session-based authentication with server-side validation
- Supabase integration with proper error handling

## Technical Decisions

### Decision: Extend Existing Quality System
**Chosen Approach**: Leverage existing `calidad_cafe` table structure and create analogous quality tables for other fruit types
**Rationale**:
- Proven data structure with validation constraints
- Consistent with existing codebase patterns
- RLS policies already established
- JSONB calculation format supports extension

### Decision: Use Existing Pricing Infrastructure
**Chosen Approach**: Extend `pricing_calculations` table to support weight-based discounts alongside quality discounts
**Rationale**:
- Immutable calculation pattern provides audit trail
- JSONB `calculation_data` supports complex breakdown structures
- Existing server actions can be extended rather than replaced
- Maintains backward compatibility with current pricing data

### Decision: Integrate with Current Form Architecture
**Chosen Approach**: Add discount visualization to existing `reception-form.tsx` without changing component structure
**Rationale**:
- Proven responsive design with mobile keypad support
- Established state management patterns
- Existing authentication and permission framework
- Minimal disruption to current user workflow

## Alternatives Considered

### Alternative 1: Separate Discount Module
- Create independent discount calculation system
- Rejected due to duplication with existing pricing infrastructure
- Would require additional user training and workflow changes

### Alternative 2: Modify Core Quality Data Structure
- Change existing `calidad_cafe` table to support multiple fruit types
- Rejected due to migration complexity and potential data loss
- Existing coffee quality data would need complex transformation

### Alternative 3: Client-side Discount Calculations
- Perform calculations in browser for immediate feedback
- Rejected due to security concerns and audit trail requirements
- Server-side calculations maintain data integrity and security

## Integration Requirements

### Database Extensions Required
1. **Weight Discount Columns**: Add to `receceptions` table
   - `total_peso_original` (DECIMAL(10,2))
   - `total_peso_descuento` (DECIMAL(10,2))
   - `total_peso_final` (DECIMAL(10,2))

2. **Discount Breakdown Table**: New `desglose_descuentos` table
   - `recepcion_id` (FK reference)
   - `parametro` (quality metric name)
   - `umbral` (threshold value)
   - `valor` (actual quality value)
   - `porcentaje_descuento` (discount percentage)
   - `peso_descuento` (weight reduction amount)

### Component Extensions Required
1. **Pricing Breakdown Component**: New component for discount visualization
2. **Form Integration**: Extend existing reception form with discount display
3. **Admin Override**: Permission-based editing capabilities for administrators
4. **Real-time Updates**: Dynamic recalculation when quality data changes

### Server Action Extensions Required
1. **Calculation Logic**: Extend pricing calculation actions for weight discounts
2. **Validation**: Add discount calculation validation schemas
3. **Permission Checks**: Implement admin-only override capabilities
4. **Audit Logging**: Track discount calculations and manual adjustments

## Performance Considerations

### Calculation Performance
- Quality threshold lookups: O(n) where n = number of thresholds per fruit type
- Multiple discount applications: Simple arithmetic operations
- Database query impact: Minimal with proper indexing on `recepciones.id`

### UI Performance
- Real-time calculation updates: <100ms for typical quality metrics
- Form responsiveness: Maintained through existing React state patterns
- Mobile performance: Custom keypad already optimized for touch devices

## Security Considerations

### Data Integrity
- Server-side validation ensures calculation accuracy
- Immutable pricing calculations prevent tampering
- RLS policies protect sensitive discount data

### Permission Management
- Admin-only editing for discount overrides
- Audit trail tracks all manual adjustments
- Session-based authentication prevents unauthorized access

## Development Risks

### Migration Complexity
- Low risk: Adding new columns to existing table
- Medium risk: Creating new discount breakdown relationships
- Mitigation: Comprehensive migration scripts with rollback procedures

### Form Integration Complexity
- Low risk: Extending existing React components
- Medium risk: Real-time calculation updates
- Mitigation: Leverage existing state management patterns

### Performance Impact
- Low risk: Database query impact minimal
- Low risk: Calculation overhead negligible
- Mitigation: Proper database indexing and caching strategies