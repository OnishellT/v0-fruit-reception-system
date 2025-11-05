# API Contracts: Dynamic Quality-Based Pricing System

This directory contains API contract definitions for the Dynamic Quality-Based Pricing System.

## Files

- `pricing-rules.md` - Pricing rules and thresholds management endpoints
- `pricing-calculations.md` - Pricing calculation and reception integration endpoints
- `data-models.md` - TypeScript type definitions and Zod schemas

## Contract Principles

### Authentication
- All endpoints require valid session authentication
- RBAC enforced: only administrators can modify pricing rules
- All users can view pricing calculations

### Error Handling
- Consistent error response format
- Validation errors return specific field issues
- Unauthorized access returns 403
- Not found returns 404

### Data Format
- JSON request/response bodies
- ISO 8601 timestamps (UTC)
- UUID for all ID fields
- Decimal values for monetary calculations

## Usage

These contracts define the interface between:
- Frontend components (UI layer)
- Server actions (business logic)
- Database layer (data persistence)

Implementations must conform to these contracts for compatibility across the system.

---

**Status**: Contract definitions ready
**Next**: Implementation per tasks.md