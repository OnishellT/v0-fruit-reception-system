# Fruit Reception System Constitution

## Core Principles

### I. Code Quality Standards
**Type Safety & Architecture**: TypeScript strict mode MUST be enabled with 100% type safety coverage. The system MUST follow Server-Client hybrid architecture using Next.js App Router with Server Components as the default and Client Components for interactivity. All data operations MUST implement the soft delete pattern to maintain data integrity. Database operations MUST enforce Row Level Security (RLS) policies for all tables. Comprehensive error handling and validation MUST be implemented at all layers using Zod schemas for runtime type validation.

**Rationale**: Ensures type safety prevents runtime errors, server-client separation optimizes performance, soft delete preserves audit trails, and RLS provides defense-in-depth security.

### II. Testing Standards (NON-NEGOTIABLE)
**E2E Testing Mandatory**: Playwright E2E testing is REQUIRED with minimum 18+ test files covering all critical workflows. The test suite MUST maintain 9/9 CRUD test pass rate at all times. Test coverage MUST include authentication flows, complete CRUD operations, and reception workflow testing. Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge) MUST be verified before releases.

**Rationale**: E2E tests catch integration issues that unit tests miss, ensuring the entire user workflow functions correctly across different browsers and devices.

### III. User Experience Consistency
**Spanish Interface & Responsive Design**: The interface MUST maintain Spanish localization throughout all user-facing text. Responsive design MUST support Desktop, Mobile, and Auto layout toggle modes. Real-time search functionality MUST be available across all data tables. Mobile devices MUST have on-screen keypad support for data entry. All critical actions MUST generate audit trail entries for compliance and tracking.

**Rationale**: Consistent UX improves operator efficiency, Spanish localization serves the target user base, responsive design ensures usability across devices, and audit trails provide compliance and debugging capabilities.

### IV. Performance Requirements
**Fast & Efficient**: Server-Side Rendering (SSR) MUST be the default rendering strategy with client-side interactivity added as needed. Database queries MUST be optimized with proper indexing on all foreign keys and frequently queried columns. Build time MUST remain under 2 seconds (current baseline ~1.8s). Initial page load time MUST be optimized through effective use of Next.js App Router features.

**Rationale**: SSR provides fast initial page loads, optimized queries prevent database bottlenecks, fast builds enable rapid iteration, and performance directly impacts user productivity in reception workflows.

### V. Security Requirements
**Custom Session-Based Authentication**: Authentication MUST use custom session-based system (NOT Supabase Auth) with bcrypt password hashing, HTTP-only secure cookies, and role-based access control (admin/operator). All authentication data MUST be properly validated and sanitized. HTTP security headers MUST be implemented. Session management MUST include proper expiration and renewal mechanisms.

**Rationale**: Custom authentication provides full control over security policies, bcrypt protects passwords, secure cookies prevent XSS attacks, and role-based access ensures principle of least privilege.

### VI. Development Guidelines
**Pattern Compliance**: Development MUST follow Server component → Client component pattern. Server actions MUST be used for all mutations (create, update, delete operations). All changes MUST be documented in markdown files. Backward compatibility MUST be maintained when possible. All code MUST follow Next.js 16+ best practices including proper use of React Server Components, streaming, and concurrent features.

**Rationale**: Consistent patterns improve code maintainability, server actions provide type safety and reduce client-server communication, documentation aids team collaboration, and Next.js best practices ensure optimal performance and developer experience.

## Security Requirements

**Authentication & Session Management**:
- Custom session-based authentication using bcrypt password hashing
- HTTP-only secure cookies with proper SameSite attributes
- Role-based access control (RBAC) with admin and operator roles
- Session expiration and renewal mechanisms
- CSRF protection on all state-changing operations

**Database Security**:
- Row Level Security (RLS) enforced on all Supabase tables
- Principle of least privilege for all database roles
- Regular security audits of RLS policies
- Encrypted connections (SSL/TLS) for all database operations

**Application Security**:
- Input validation using Zod schemas on all user inputs
- SQL injection prevention through parameterized queries
- XSS protection through proper output encoding
- Content Security Policy (CSP) headers implementation
- Secure headers configuration (HSTS, X-Frame-Options, etc.)

**Audit & Compliance**:
- Comprehensive audit logging for all critical operations
- Log retention policy compliance
- Regular review of audit logs
- Tamper-evident logging mechanisms
- GDPR compliance for user data handling

## Development Workflow

**Code Quality Gates**:
- TypeScript strict mode with zero type errors
- ESLint and Prettier configuration enforcement
- Pre-commit hooks for code formatting and linting
- Automated testing (unit, integration, E2E) before merge
- Security scanning for vulnerabilities

**Testing Workflow**:
- E2E tests using Playwright for all user journeys
- Minimum 18+ test files maintained
- 9/9 CRUD test pass rate requirement
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness testing on various device sizes
- Accessibility testing for compliance

**Documentation Standards**:
- All features documented in markdown files
- Architecture decisions recorded (ADRs)
- API documentation for server actions
- Database schema documentation
- Deployment and运维 guides maintained

**Review Process**:
- All code changes require peer review
- Security-sensitive changes require security review
- Performance impact assessment for database changes
- Backward compatibility verification
- Test coverage validation before merge

**Deployment Pipeline**:
- Build time must remain under 2 seconds
- Automated deployment to staging environment
- Smoke tests on production deployment
- Rollback capability for all deployments
- Environment variable management

## Governance

**Constitution Authority**: This constitution supersedes all other development practices and guidelines. Any conflicts between this document and other documentation must be resolved in favor of this constitution.

**Amendment Process**: Amendments to this constitution require:
1. Proposal with detailed justification
2. Impact analysis on existing code and workflows
3. Migration plan for any required changes
4. Review and approval from technical leadership
5. Documentation of changes in the constitution changelog
6. Version bump following semantic versioning rules

**Versioning Policy**:
- MAJOR: Backward-incompatible governance changes or principle redefinitions
- MINOR: New principles added or materially expanded guidance
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Compliance Verification**:
- All pull requests must verify compliance with constitution principles
- Code review process must include constitution adherence checks
- Automated checks for TypeScript strict mode and test coverage
- Regular audits of security and performance requirements
- Quarterly review of principles for continued relevance

**Exception Process**: Deviations from this constitution require:
1. Documented business justification
2. Risk assessment of the exception
3. Compensating controls if applicable
4. Time-limited approval with review date
5. Escalation to technical leadership for approval

**Version**: 1.0.0 | **Ratified**: 2025-10-31 | **Last Amended**: 2025-10-31
