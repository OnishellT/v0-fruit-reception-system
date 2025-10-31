# Spec Kit Commands - Fruit Reception System

## Project Overview
- **Name:** Fruit Reception System
- **Tech Stack:** Next.js 16+, TypeScript, Supabase (PostgreSQL), Tailwind CSS
- **Status:** Production-ready (build working, 18+ tests, comprehensive docs)
- **Current Issue:** Database needs seed data for full testing

---

## Spec Kit Setup Commands

### 1. Install Specify CLI

Choose **Option 1** (Persistent Installation - Recommended):

```bash
# Install once, use everywhere
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Verify installation:
```bash
specify --version
```

---

### 2. Initialize Spec Kit in Project

```bash
# Run from project root
specify init fruit-reception-system
```

**Note:** Since you're already in the project directory, Spec Kit will recognize the existing Next.js + TypeScript structure.

---

### 3. Create Project Constitution

Launch your AI assistant and use the `/speckit.constitution` command:

```
/speckit.constitution

Create principles focused on:

**Code Quality Standards:**
- TypeScript strict mode enabled (100% type safety)
- Server-Client hybrid architecture (Next.js App Router)
- Reusable component patterns (DataTable abstraction)
- Soft delete pattern for data integrity
- Row Level Security (RLS) for database
- Comprehensive error handling and validation

**Testing Standards:**
- Playwright E2E testing (18+ test files)
- Maintain 9/9 CRUD test pass rate
- Test coverage for authentication, CRUD, and reception workflows
- Cross-browser compatibility testing

**User Experience Consistency:**
- Spanish interface (existing localization)
- Responsive design (Desktop/Mobile/Auto layout toggle)
- Real-time search across all tables
- On-screen keypad for mobile devices
- Audit trail for all critical actions

**Performance Requirements:**
- Fast initial page load (SSR by default)
- Optimized database queries with proper indexing
- Build time under 2 seconds (currently ~1.8s)
- Server-side rendering with client-side interactivity

**Security Requirements:**
- Custom session-based authentication (not Supabase Auth)
- bcrypt password hashing
- HTTP-only secure cookies
- Role-based access control (admin/operator)
- Audit logging for compliance

**Development Guidelines:**
- Follow existing patterns: Server component → Client component
- Use server actions for mutations
- Document all changes in markdown
- Maintain backward compatibility
- Follow Next.js 16+ best practices
```

---

### 4. Create Specification

Use `/speckit.specify` to describe your requirements:

```
/speckit.specify

Build enhancements for the Fruit Reception System - an agricultural management application for tracking dried fruit reception from Dominican Republic farms.

**Current State:**
- Production-ready Next.js application
- Complete CRUD for: Receptions, Providers, Drivers, Fruit Types, Associations, Users, Audit Logs
- 18+ automated tests (9/9 CRUD passing)
- Comprehensive documentation (20 files)
- Authentication working (admin/admin123)
- Spanish interface throughout

**Immediate Enhancement Needed:**
Add seed data initialization system to enable full testing and onboarding:

**Feature Requirements:**
1. **Database Seed System**
   - Create TypeScript script to populate database with sample data
   - Include: 5+ Providers (farms), 5+ Drivers, 10+ Fruit Types (CACAO, CAFÉ, MIEL, COCOS with subtypes)
   - Include: 1+ Association (FARCOS), 1 Admin user, 1 Operator user
   - Add sample Receptions with Details for testing
   - Make it idempotent (safe to run multiple times)

2. **Setup Wizard**
   - Create /setup page for first-time users
   - Detect if database needs initialization
   - One-click seed data installation
   - Progress indicator during setup
   - Success confirmation with next steps

3. **Testing Utilities**
   - Update reception tests to work with seed data
   - Add database reset functionality for tests
   - Create test data factory functions
   - Verify all 18+ tests pass after setup

**Why This Matters:**
The application is production-ready but blocked from full testing because the reception form requires at least 1 Provider, 1 Driver, and 1 Fruit Type to function. New developers cannot test the reception workflow without manual data entry or SQL scripts.

**Success Criteria:**
- New developers can run `npm install && npm run dev` and have a working system in < 5 minutes
- All 18+ tests pass without manual database setup
- First-time users see a setup wizard instead of empty forms
- Sample data represents realistic Dominican farm scenarios
```

---

### 5. Create Technical Implementation Plan

Use `/speckit.plan`:

```
/speckit.plan

**Tech Stack & Architecture:**

**Core Framework:**
- Next.js 16+ (App Router / Turbopack) ✓ Existing
- TypeScript 5.0.2 ✓ Existing
- React 19.2.0 ✓ Existing

**Database:**
- Supabase PostgreSQL ✓ Existing
- Row Level Security (RLS) ✓ Existing
- Soft delete pattern ✓ Existing

**Seed Data Approach:**
Use TypeScript scripts (not SQL) for better maintainability:

1. **Create seed-data script:**
   - `scripts/seed-database.ts` - Main seed script
   - Uses existing server action patterns
   - Type-safe data insertion
   - Idempotent operations (UPSERT)

2. **Setup wizard page:**
   - `app/setup/page.tsx` - Server component
   - `components/setup-wizard.tsx` - Client component
   - Check database status on load
   - Button to trigger seeding
   - Real-time progress updates

3. **Database utilities:**
   - `lib/utils/seed-helpers.ts` - Helper functions
   - `lib/utils/test-data-factory.ts` - Factory patterns
   - Reset functionality for testing

**File Structure Additions:**
```
scripts/
├── seed-database.ts              # Main seed script
├── reset-database-for-tests.ts   # Test reset utility
utils/
├── seed-helpers.ts               # Seed helper functions
└── test-data-factory.ts          # Factory patterns
app/
└── setup/
    ├── page.tsx                  # Setup wizard
    └── setup-wizard.tsx          # Client component
```

**Minimal Dependencies:**
- Reuse existing libraries (no new packages)
- Use existing Supabase client
- Follow existing server action patterns
- Use Next.js built-in features only

**Migration Strategy:**
1. Create seed script first
2. Test seed script manually
3. Create setup wizard UI
4. Update tests to use seed data
5. Document new setup process
```

---

### 6. Break Down Into Tasks

Use `/speckit.tasks`:

```
/speckit.tasks

Create actionable task list from the implementation plan:

**Priority 1 - Core Seeding (Must Have)**
1. Create seed-helpers.ts with provider/driver/fruit type creators
2. Create test-data-factory.ts for generating test data
3. Build seed-database.ts main script with UPSERT logic
4. Test seed script manually with empty database
5. Verify seed data appears correctly in UI

**Priority 2 - Setup Wizard (Should Have)**
6. Create app/setup/page.tsx server component
7. Build components/setup-wizard.tsx client component
8. Add database status detection logic
9. Implement seed trigger with progress tracking
10. Add success confirmation page

**Priority 3 - Testing (Could Have)**
11. Update test scripts to use seed data
12. Create reset-database-for-tests.ts utility
13. Verify all 18 tests pass with seed data
14. Add seed data to CI/CD pipeline

**Priority 4 - Documentation (Nice to Have)**
15. Update DATABASE-SETUP.md with new process
16. Add seed script usage to README.md
17. Document seed data schema
18. Create troubleshooting guide
```

---

### 7. Execute Implementation

Use `/speckit.implement`:

```
/speckit.implement

Execute all tasks from the task list in priority order:

**Start with Priority 1 - Core Seeding:**

Task 1: Create seed-helpers.ts with provider/driver/fruit type creators
- Location: lib/utils/seed-helpers.ts
- Follow existing type definitions from lib/actions/*.ts
- Use createServiceRoleClient() for server-side access
- Include proper error handling and logging

Task 2: Create test-data-factory.ts
- Location: lib/utils/test-data-factory.ts
- Factory functions for generating sample data
- Include realistic Dominican farm names
- Support different data volumes (dev/test/prod)

Task 3: Build seed-database.ts main script
- Location: scripts/seed-database.ts
- UPSERT pattern for idempotency
- Progress logging
- Transaction safety
- Error rollback on failure

Task 4: Test seed script
- Run against empty/clean database
- Verify all tables populated correctly
- Check relationships intact
- Confirm data appears in UI

Task 5: Verify seed data in UI
- Login and check each module
- Providers list shows sample data
- Drivers list shows sample data
- Fruit Types list shows sample data
- Can create reception with sample data

[Continue with remaining tasks...]
```

---

## Additional Spec Kit Commands

### Check Project Status

```bash
# Check what Spec Kit has generated
specify check

# View generated files
ls -la speckit/
```

### Regenerate Specific Component

```bash
# If you need to regenerate a specific part
specify regenerate --component seed-database
```

### Update Constitution

```bash
# Modify principles if needed
specify constitution update
```

---

## Post-Spec-Kit Setup

### After Running Spec Kit Commands:

1. **Install Dependencies** (if Spec Kit added any):
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Build and Test**:
   ```bash
   npm run build
   npm run dev
   ```

3. **Run All Tests**:
   ```bash
   npm run test:all
   ```

4. **Access Application**:
   - URL: http://localhost:3001
   - Login: admin / admin123
   - Setup wizard should appear if database needs seeding

---

## Useful Resources

- **Existing Documentation:** `docs/README.md` → Start here
- **Architecture:** `docs/COMPLETE-ARCHITECTURE.md` (59KB)
- **All Changes:** `docs/ALL-CHANGES-DOCUMENTATION.md` (38KB)
- **Database Setup:** `docs/DATABASE-SETUP.md`

---

## Current Project Status

✅ **Working:**
- Build system (18/18 routes)
- Dev server (port 3001)
- Authentication (admin/admin123)
- CRUD operations (9/9 tests passing)
- 18+ test files created
- Comprehensive docs (20 files)

⚠️ **Blocked:**
- Database needs seed data for full testing
- Reception tests blocked (requires Provider/Driver/Fruit Type)

🎯 **Next Goal:**
Use Spec Kit to implement seed data system → Enable full testing → Production ready!

---

**Generated:** October 31, 2025
**Project Version:** 2.0 (Post-LLM Enhancements)
**Spec Kit Integration:** Ready
