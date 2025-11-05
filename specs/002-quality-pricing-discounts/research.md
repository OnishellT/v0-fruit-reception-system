# Research & Analysis: Dynamic Quality-Based Pricing System

**Date**: 2025-10-31
**Feature**: Dynamic Quality-Based Pricing System
**Status**: Complete

## Executive Summary

This document presents the research findings and analysis for implementing a Dynamic Quality-Based Pricing System for the fruit reception workflow. The system will enable administrators to configure discount thresholds based on quality metrics (Violetas, Humedad, Moho) for different fruit types (Café, Cacao, Miel, Cocos), with automatic calculation during reception processing.

## Current System Analysis

### Existing Infrastructure Review

**Technology Stack:**
- Next.js 16+ with App Router
- TypeScript 5.0.2
- React 19.2.0
- Supabase (PostgreSQL)
- Tailwind CSS
- Playwright E2E testing framework

**Current Authentication & Authorization:**
- Custom session-based authentication (NOT Supabase Auth)
- bcrypt password hashing
- HTTP-only secure cookies
- Role-Based Access Control (RBAC) with admin/operator roles

### Existing Data Model

**Fruit Types (Identified):**
- Café
- Cacao
- Miel
- Cocos

**Quality Metrics (Identified):**
- Violetas (Purple/Mold detection)
- Humedad (Moisture level)
- Moho (Mold presence)

**Existing Tables (To Be Analyzed):**
- `receptions` - stores reception records
- `quality_evaluations` - stores quality measurement data
- `fruit_types` - catalog of available fruit types
- `users` - user authentication and roles

### Integration Points

1. **Reception Workflow**: The pricing calculation must integrate seamlessly with the existing reception saving process
2. **Quality Evaluation**: Must leverage existing quality evaluation data without duplication
3. **User Roles**: Administrators need configuration interface; Reception Operators need pricing visibility
4. **Historical Data**: Pricing calculations must be immutable once saved

## Business Requirements Analysis

### Primary Use Cases

1. **Administrator Configuration**
   - Enable/disable quality-based pricing per fruit type
   - Create threshold ranges for each quality metric
   - Modify pricing rules without affecting historical data

2. **Reception Processing**
   - Automatic discount calculation during reception save
   - Transparent pricing breakdown display
   - Validation of required quality metrics

3. **Financial Reporting**
   - Audit trail of pricing calculations
   - Historical comparison of pricing rules
   - Breakdown of discounts by quality metric

### Success Metrics

- Configuration time: Under 3 minutes per fruit type
- Processing time: Under 5 seconds per reception
- Accuracy: 100% correct pricing calculations
- Capacity: 50 simultaneous reception entries
- Usability: 95% administrator success rate without training

## Technical Research

### Database Design Considerations

**Immutability Requirement:**
- Pricing calculations must be stored with the reception
- Changes to threshold rules must NOT affect historical receptions
- Need to snapshot all relevant data at time of calculation

**Performance Considerations:**
- Threshold lookups must be fast (O(log n) or better)
- Pricing calculation should not block reception saving
- Concurrent reception processing must be supported

**Data Integrity:**
- Foreign key constraints to ensure referential integrity
- Validation to prevent overlapping threshold ranges (if desired)
- Audit logging for all configuration changes

### Security & Compliance

**Access Control:**
- Only administrators can modify pricing rules
- All users can view pricing breakdowns for receptions they process
- RBAC enforcement through Supabase RLS policies

**Data Protection:**
- All financial calculations must be auditable
- No deletion of pricing calculations (soft delete pattern)
- Secure session management

### User Experience Requirements

**Spanish Localization:**
- All user-facing text must be in Spanish
- Currency formatting for local standards
- Clear validation messages in Spanish

**Responsive Design:**
- Desktop interface for administrators
- Mobile-friendly for reception operators
- Touch-friendly controls for tablet use

## Risk Assessment

### High-Risk Areas

1. **Data Migration**
   - Risk: Loss of existing data or corruption
   - Mitigation: Comprehensive backup, staged rollout, rollback plan

2. **Performance Degradation**
   - Risk: Slower reception processing
   - Mitigation: Database indexing, query optimization, caching

3. **Incorrect Calculations**
   - Risk: Financial losses due to pricing errors
   - Mitigation: Comprehensive testing, validation rules, audit trails

### Medium-Risk Areas

1. **User Adoption**
   - Risk: Administrators struggle with configuration
   - Mitigation: Intuitive UI, clear documentation, guided setup

2. **Integration Complexity**
   - Risk: Disruption to existing workflow
   - Mitigation: Incremental rollout, feature flags, fallback mechanisms

### Low-Risk Areas

1. **UI Development**
   - Risk: Minor usability issues
   - Mitigation: User testing, iterative improvement

2. **Localization**
   - Risk: Incomplete or incorrect translations
   - Mitigation: Native Spanish speaker review, standardized terminology

## Recommended Implementation Approach

### Phase-Based Delivery

**Phase 1 (MVP)**: User Stories 1 + 2
- Admin configuration interface
- Automatic pricing calculation for receptions
- Basic pricing breakdown display

**Phase 2**: User Story 3
- Historical pricing review
- Audit trail functionality
- Comparison tools

**Phase 3**: User Story 4
- Advanced configuration management
- Rule versioning and rollback
- Enhanced validation

### Technical Architecture

**Database Layer:**
- New tables: `pricing_rules`, `discount_thresholds`, `pricing_calculations`
- Extended: `receptions` with FK to `pricing_calculations`
- RLS policies for all new tables

**Application Layer:**
- Server-side pricing calculation engine
- Zod validation schemas
- Server actions for all operations

**Presentation Layer:**
- Admin configuration pages
- Reception form integration
- Pricing breakdown components

## Research Conclusion

The Dynamic Quality-Based Pricing System is technically feasible with the current Next.js + Supabase architecture. The primary challenges are:

1. **Ensuring immutability** of pricing calculations
2. **Performance** of threshold lookups during high-volume reception processing
3. **User experience** for complex pricing rule configuration

All challenges are addressable through careful database design, proper indexing, and intuitive UI development.

## Next Steps

1. **Database Design**: Create detailed schema for all new tables
2. **API Contract Definition**: Define all server actions and their contracts
3. **Implementation Planning**: Break down into detailed tasks (see tasks.md)

---

**Status**: Research complete - Ready for Phase 1 (Data Model Design)
**Next Document**: data-model.md