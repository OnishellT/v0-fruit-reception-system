# Claude Code - Fruit Reception System

**Project:** Fruit Reception System for Dominican Republic Farms
**Status:** Production-Ready (v2.0 Enhanced from Vercel v0)
**Stack:** Next.js 16+ + TypeScript + Supabase + Playwright

---

## 🎯 Project Overview

A comprehensive agricultural management system for tracking dried fruit reception from Dominican Republic farms. Originally built with Vercel's v0 in ~6 minutes (Oct 28, 2025), then enhanced into a production-ready application with complete CRUD operations, reusable components, testing suite, and documentation.

**Key Features:**
- 🔐 Custom authentication (username/password, NOT Supabase Auth)
- 📦 Complete reception management (create + edit)
- 👥 Provider & driver management
- 🍈 Fruit type classification (CACAO, CAFÉ, MIEL, COCOS)
- 🏢 Farmer associations (FARCOS)
- 📊 Audit logging system
- 📱 Responsive design with layout toggle (Desktop/Mobile/Auto)
- 🔍 Real-time search across all tables
- 🧪 Comprehensive testing suite (18+ test files)

**Default Login:** admin / admin123

---

## 🏗️ Architecture Overview

### Core Architecture Pattern: Server-Client Hybrid

The system uses a **Server-Client hybrid pattern** for optimal performance:

```
Server Component (async) → Fetches data → Client Component (interactive)
```

**Pattern:**
1. **Server Components** (page.tsx) - Handle data fetching, rendering on server
2. **Client Components** (table-client.tsx) - Handle interactivity, state management
3. **Reusable Components** - DataTable, forms, UI primitives

**Key Benefits:**
- Fast initial page load (SSR)
- Interactive UI (CSR)
- Best of both worlds

### Directory Structure

```
/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   │   └── login/
│   └── dashboard/           # Protected dashboard routes
│       ├── [module]/
│       │   ├── page.tsx                 # Server component (data fetching)
│       │   └── [module]-table-client.tsx # Client component (UI/interactivity)
│       ├── new/               # Create pages
│       └── [id]/              # Detail/edit pages
│
├── components/              # Reusable components
│   ├── ui/                  # Radix UI primitives
│   ├── data-table.tsx       # ⭐ Reusable DataTable (358 lines)
│   └── reception-form.tsx   # Dual-mode form (create/edit)
│
├── lib/                     # Business logic
│   ├── actions/             # Server actions (CRUD operations)
│   └── supabase/            # Database client
│
├── hooks/                   # Custom React hooks
│   └── use-user-preferences.ts # Layout mode management
│
├── tests/                   # Playwright E2E tests (18+ files)
│   ├── test-auth.js
│   ├── test-crud-comprehensive.js
│   └── ...
│
└── docs/                    # Documentation (20 files)
    ├── COMPLETE-ARCHITECTURE.md
    ├── ALL-CHANGES-DOCUMENTATION.md
    └── ...
```

---

## 🎨 Code Style & Clean Code Practices

### 1. Component Organization

**Rule: Always use Server-Client hybrid pattern**

```typescript
// ❌ WRONG - Client component fetching data
"use client";
export default function ReceptionPage() {
  const [data, setData] = useState([]);
  useEffect(() => { fetchData(); }, []);
  return <table>...</table>;
}

// ✅ CORRECT - Server component fetches, client component displays
// app/dashboard/reception/page.tsx (Server)
export default async function ReceptionPage() {
  const { receptions } = await getReceptions();
  return <ReceptionsTableClient receptions={receptions} />;
}

// app/dashboard/reception/receptions-table-client.tsx (Client)
"use client";
export default function ReceptionsTableClient({ receptions }) {
  const columns = [...];
  return <DataTable data={receptions} columns={columns} />;
}
```

**Rule: Co-locate client components with their pages**

```
app/dashboard/reception/
├── page.tsx                    # Server component
└── receptions-table-client.tsx # Client component (co-located)
```

### 2. TypeScript Best Practices

**Rule: Always use TypeScript - NO `any` types**

```typescript
// ✅ CORRECT - Strongly typed
interface Reception {
  id: string;
  reception_number: string;
  provider: Provider;
  driver: Driver;
}

export async function createReception(data: CreateReceptionInput) {
  // ...
}

// ✅ CORRECT - Type-safe columns
const columns: Column<Reception>[] = [
  { key: "reception_number", label: "Número", sortable: true },
  { key: "provider.name", label: "Proveedor", searchable: true },
];

// ✅ CORRECT - Generic DataTable
<DataTable<Reception>
  data={receptions}
  columns={columns}
  searchPlaceholder="Buscar..."
/>
```

### 3. Server Actions Pattern

**Rule: All database operations in `lib/actions/`**

```typescript
// lib/actions/reception.ts
"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function createReception(data: CreateReceptionInput) {
  // 1. Validate session
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  // 2. Create Supabase client
  const supabase = await createServiceRoleClient();

  // 3. Handle empty strings → null for UUIDs
  const providerId = data.provider_id || null;

  // 4. Database operation
  const { data: reception, error } = await supabase
    .from("receptions")
    .insert({ ... })
    .select()
    .single();

  if (error) {
    return { error: "Error creating reception" };
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard/reception");

  return { success: true, reception };
}
```

**Server Action Guidelines:**
- Start with `"use server";`
- Always validate authentication (`getSession()`)
- Handle empty strings → null for UUID fields
- Use service role client for privileged operations
- Revalidate paths after mutations (`revalidatePath`)
- Log errors for debugging
- Return `{ error }` or `{ success }` objects

### 4. Error Handling

**Rule: Always handle errors gracefully**

```typescript
export async function getReceptions() {
  const supabase = await createServiceRoleClient();

  const { data: receptions, error } = await supabase
    .from("receptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching receptions:", error);
    return { error: "Error al obtener recepciones" };
  }

  return { receptions };
}
```

### 5. State Management

**Rule: Use React hooks appropriately**

```typescript
// Client components use hooks for interactivity
"use client";
export default function Component({ data }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Memoize expensive computations
  const filteredData = useMemo(() => {
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Callback memoization
  const handleSort = useCallback((column: string) => {
    // ... sorting logic
  }, []);

  return <DataTable data={filteredData} />;
}
```

### 6. Database Query Patterns

**Rule: Follow soft delete pattern**

```typescript
// ✅ CORRECT - Filter soft-deleted records
await supabase
  .from("providers")
  .select("*")
  .is("deleted_at", null)  // Only active records
  .order("name");

// ✅ CORRECT - Soft delete instead of hard delete
await supabase
  .from("providers")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", id);

// ✅ CORRECT - Fetch related data with joins
const { data, error } = await supabase
  .from("receptions")
  .select(`
    *,
    provider:providers(id, name, code),
    driver:drivers(id, name),
    fruit_type:fruit_types(id, type, subtype)
  `)
  .order("created_at", { ascending: false });
```

### 7. Soft Delete Pattern

**Rule: NEVER use hard deletes**

All tables have `deleted_at` TIMESTAMPTZ column for soft deletes:

- ✅ Updates `deleted_at` timestamp
- ❌ Never uses `.delete()`
- ✅ Queries filter `is("deleted_at", null)`
- ✅ Prevents foreign key errors
- ✅ Allows data recovery

---

## 🧪 Testing Standards

**Testing Framework:** Playwright E2E Testing

### Test Structure

All tests follow this pattern:

```javascript
const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`✅ Test passed: ${name}`);
  } catch (error) {
    failed++;
    console.log(`❌ Test failed: ${name}`);
    console.error(error);
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};
```

### Test Categories

1. **Authentication Tests** (`test-auth.js`)
   - Login flow
   - Session management
   - Authorization checks

2. **CRUD Tests** (`test-crud-comprehensive.js`)
   - CREATE operations
   - READ operations
   - **Status: 9/9 PASSED** ✅

3. **Reception Tests** (`test-reception-*.js`)
   - Form accessibility
   - Field validation
   - Form submission
   - **Status: Blocked by database setup**

4. **Debug Tests** (Various)
   - Dropdown debugging
   - Detail row debugging

### Running Tests

```bash
# Run specific test
node tests/test-auth.js

# Run all tests
npm run test:all

# Run CRUD tests
npm run test:crud

# Run with Playwright
npx playwright test
```

### Testing Prerequisites

1. Dev server running: `npm run dev` (port 3001)
2. Database with seed data configured
3. Playwright browsers installed

### Writing New Tests

**Rule: Always write tests for new features**

```javascript
// 1. Navigate to page
await page.goto("http://localhost:3001/dashboard/reception/new");

// 2. Login if needed
await page.fill("#username", "admin");
await page.fill("#password", "admin123");
await page.click("button[type='submit']");
await page.waitForURL("**/dashboard");

// 3. Fill form
await page.selectOption("#provider_id", "PROV001");
await page.selectOption("#driver_id", "Carlos Rodríguez");
await page.fill("#truck_plate", "ABC-123");
await page.fill("#total_containers", "10");

// 4. Add detail row
await page.click('[data-add-detail]');
await page.fill('[data-detail-quantity]', "5");
await page.fill('[data-detail-weight]', "25.5");

// 5. Submit
await page.click("button[type='submit']");

// 6. Verify
await page.waitForURL("**/dashboard/reception");
const successMessage = await page.textContent("[data-success]");
assert(successMessage.includes("éxito"), "Success message not found");
```

---

## 📚 Documentation Standards

**Total Documentation:** 20 files, ~16,000 lines

### Documentation Files

**Core Documentation:**
1. `README.md` - Navigation and quick start
2. `COMPLETE-ARCHITECTURE.md` - Complete system architecture (2,250+ lines)
3. `ALL-CHANGES-DOCUMENTATION.md` - All development changes (1,300+ lines)

**Feature Documentation:**
- `DataTable-USAGE.md` - Complete DataTable usage guide
- `ON-SCREEN-KEYPAD.md` - Keypad implementation
- `LAYOUT-TOGGLE-FIX.md` - Layout toggle solution
- `SOFT_DELETE_IMPLEMENTATION.md` - Soft delete details

**Bug Fix Documentation:**
- `ASYNC_CLIENT_COMPONENT_FIX.md`
- `UUID_FIX_SUMMARY.md`
- `TRUCK_PLATE_FIX_SUMMARY.md`
- `RECEPTION-DETAILS-FIX.md`

### Writing Documentation

**Rule: Document all non-trivial changes**

When implementing a new feature or fixing a bug:

1. **Add JSDoc comments to functions**

```typescript
/**
 * Creates a new reception record with details
 * @param data - Reception data including provider, driver, and fruit details
 * @returns Promise with { success, reception } or { error }
 * @throws Error if session is invalid or database operation fails
 */
export async function createReception(data: CreateReceptionInput) {
  // ...
}
```

2. **Document complex components**

```typescript
/**
 * Reusable DataTable component with built-in functionality
 * @param data - Array of data objects to display
 * @param columns - Column definitions with type safety
 * @param searchPlaceholder - Placeholder text for search input
 * @param pageSize - Number of items per page (default: 10)
 *
 * @example
 * const columns: Column<Reception>[] = [
 *   { key: "reception_number", label: "Número", sortable: true },
 *   { key: "provider.name", label: "Proveedor", searchable: true },
 * ];
 *
 * return (
 *   <DataTable
 *     data={receptions}
 *     columns={columns}
 *     searchPlaceholder="Buscar recepciones..."
 *   />
 * );
 */
export function DataTable<T>({ data, columns, ... }: DataTableProps<T>) {
  // ...
}
```

3. **Create documentation for new features**

When adding a new feature, create a markdown file in `docs/` explaining:
- What it does
- How to use it
- Implementation details
- Examples

4. **Update existing documentation**

When modifying existing functionality:
- Update relevant docs
- Add change log entry
- Update architecture docs if needed

### Documentation Template

```markdown
# [Feature Name] Documentation

## Overview
Brief description of what this feature does.

## Implementation
How it works internally.

## Usage
How to use the feature (with examples).

## Files Modified
- File 1
- File 2

## Related
Links to related documentation or issues.
```

---

## 📦 Git Organization

### Commit Message Convention

**Format:** `type(scope): description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```bash
feat(reception): add edit functionality to reception module
fix(uuid): convert empty strings to null for UUID fields
docs(architecture): update COMPLETE-ARCHITECTURE.md with new patterns
test(crud): add provider creation test case
refactor(tables): migrate to reusable DataTable component
```

### Branching Strategy

**Main branches:**
- `main` - Production-ready code
- `develop` - Integration branch for features

**Feature branches:**
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-name` - Documentation updates

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Make changes with clear commits**
   ```bash
   git add .
   git commit -m "feat(module): description of change"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/new-feature-name
   ```

4. **After review and tests pass, merge to main**

### Adding Files to Git

**Rule: Always check git status before committing**

```bash
# Check what files have changed
git status

# Add specific files
git add app/dashboard/new-module/page.tsx
git add lib/actions/new-module.ts
git add docs/NEW-FEATURE.md

# Add all changes (be careful!)
git add .
```

**Files to ALWAYS commit:**
- All source code (.tsx, .ts, .js)
- Documentation (.md)
- Configuration files (package.json, tsconfig.json)
- SQL migration scripts

**Files to NEVER commit:**
- `node_modules/`
- `.next/`
- `.env.local`
- `.env.*` (except `.env.example`)
- `*.log`
- Temporary files

### .gitignore (Already configured)

```
node_modules/
.next/
.env.local
.env
*.log
.tsbuildinfo
```

---

## 🎯 Key Conventions

### 1. DataTable Component Usage

**The DataTable is the primary reusable component**

```typescript
// Define columns with proper typing
const columns: Column<Reception>[] = [
  {
    key: "reception_number",
    label: "Número",
    sortable: true,
    searchable: true,
  },
  {
    key: "provider.name",
    label: "Proveedor",
    sortable: true,
    searchable: true,
  },
  {
    key: "actions",
    label: "Acciones",
    align: "right",
    render: (_, row) => (
      <Link href={`/dashboard/reception/${row.id}`}>
        <Button size="sm">Ver</Button>
      </Link>
    ),
  },
];

// Use in client component
return (
  <DataTable
    data={receptions}
    columns={columns}
    searchPlaceholder="Buscar recepciones..."
    pageSize={20}
  />
);
```

**Features:**
- ✅ Real-time search
- ✅ Sorting (ascending/descending)
- ✅ Pagination
- ✅ Type-safe with generics
- ✅ Nested property support (`user.name`)
- ✅ Custom render functions

### 2. Page Pattern

**Every module follows this pattern:**

```
app/dashboard/[module]/
├── page.tsx                    # Server component - data fetching
├── [module]-table-client.tsx   # Client component - DataTable
├── new/
│   └── page.tsx                # Create page
└── [id]/
    ├── page.tsx                # Detail page
    └── edit/
        └── page.tsx            # Edit page
```

### 3. Server Actions Naming

```typescript
// lib/actions/module.ts

// Get operations (no session required)
export async function getProviders() { ... }
export async function getProviderById(id: string) { ... }

// CRUD operations (session required)
export async function createProvider(data: CreateProviderInput) { ... }
export async function updateProvider(id: string, data: UpdateProviderInput) { ... }
export async function deleteProvider(id: string) { ... } // Soft delete
```

### 4. Form Validation

**Rule: Validate on both client and server**

```typescript
// Client-side validation (React Hook Form + Zod)
const schema = z.object({
  code: z.string().min(1, "Código requerido"),
  name: z.string().min(1, "Nombre requerido"),
});

const { handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

// Server-side validation (in server action)
export async function createProvider(data) {
  if (!data.code || !data.name) {
    return { error: "Campos requeridos faltantes" };
  }
  // ...
}
```

### 5. Import Organization

**Standard import order:**

```typescript
// 1. React/Next.js
import { useState, useMemo } from "react";
import Link from "next/link";

// 2. UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 3. Icons
import { Plus, Edit, Trash } from "lucide-react";

// 4. Custom components
import { DataTable, Column } from "@/components/data-table";

// 5. Types
import type { Provider } from "@/types/database";

// 6. Utilities
import { cn } from "@/lib/utils";
```

### 6. Naming Conventions

**Files:**
- PascalCase for components: `ReceptionForm.tsx`
- camelCase for utilities: `createReception.ts`
- kebab-case for pages: `receptions-table-client.tsx`

**Variables/Functions:**
- camelCase: `const providerId`, `function getProviders()`
- PascalCase for types/interfaces: `interface Reception`, `type CreateProviderInput`
- UPPER_CASE for constants: `const API_URL = "..."`

---

## 🔧 Common Tasks

### Adding a New Module

1. **Create database tables** (in Supabase SQL Editor)
2. **Add server actions** in `lib/actions/new-module.ts`
3. **Create pages** in `app/dashboard/new-module/`
4. **Create table client** in `app/dashboard/new-module/new-module-table-client.tsx`
5. **Add navigation** in dashboard layout
6. **Write tests** in `tests/test-new-module.js`
7. **Document** in `docs/NEW-MODULE.md`

### Modifying Database Schema

1. **Create migration SQL** in `scripts/XX-add-feature.sql`
2. **Test migration** in Supabase SQL Editor
3. **Update TypeScript types** (if applicable)
4. **Update server actions** to reflect new schema
5. **Test changes** with Playwright

### Debugging Issues

1. **Check console logs** in browser dev tools
2. **Check server logs** in terminal
3. **Review test output** for failures
4. **Check database** directly in Supabase
5. **Use debug tests** in `tests/test-debug-*.js`

### Running the Application

```bash
# Install dependencies (first time)
pnpm install

# Run development server
npm run dev
# → http://localhost:3001

# Login with:
# Username: admin
# Password: admin123

# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 Current Status

### ✅ Production Ready Features
- Authentication system (working)
- CRUD operations (9/9 tests passing)
- Build system (18/18 routes)
- Documentation (20 files)
- Dev server (running on port 3001)

### ⚠️ Pending Items
- Database setup with seed data (for full testing)
- Reception form tests (blocked by database)
- End-to-end tests (blocked by database)

### 📈 Metrics
- **Code Lines:** ~3,530 total
- **Components:** 15+ reusable
- **Test Files:** 18+
- **Documentation:** 20 files
- **Routes:** 19
- **Architecture:** Modern, scalable, production-ready

---

## 🚀 Quick Start for Claude

When working on this codebase:

1. **Understand the architecture:**
   - Read `docs/COMPLETE-ARCHITECTURE.md`
   - Review DataTable component
   - Check server actions pattern

2. **Follow established patterns:**
   - Use Server-Client hybrid
   - Apply soft delete pattern
   - Write TypeScript (no `any`)
   - Add tests for new features

3. **Check before modifying:**
   - Run `git status`
   - Review related tests
   - Update documentation

4. **Common commands:**
   ```bash
   npm run dev          # Start dev server
   npm run test:crud    # Run CRUD tests
   npm run build        # Build project
   git status           # Check changes
   ```

5. **Key files to understand:**
   - `components/data-table.tsx` - Core reusable component
   - `lib/actions/reception.ts` - Server action pattern
   - `app/dashboard/reception/page.tsx` - Page pattern
   - `tests/test-crud-comprehensive.js` - Test patterns

---

## 💡 Best Practices Summary

✅ **DO:**
- Use Server-Client hybrid architecture
- Write TypeScript with proper types
- Follow soft delete pattern
- Write tests for new features
- Document non-trivial changes
- Keep git commits atomic and descriptive
- Use DataTable for all table displays
- Validate on both client and server
- Handle errors gracefully
- Use proper naming conventions

❌ **DON'T:**
- Use hard deletes
- Mix server/client concerns
- Use `any` types
- Skip tests for new features
- Commit sensitive data (.env, node_modules)
- Leave console.logs in production code
- Skip error handling
- Use custom tables (use DataTable instead)
- Forget to revalidate paths after mutations

---

## 📚 Essential Documentation

1. **COMPLETE-ARCHITECTURE.md** - Full system architecture (MUST READ)
2. **ALL-CHANGES-DOCUMENTATION.md** - Evolution from V0
3. **DataTable-USAGE.md** - How to use the DataTable
4. **README.md** - Quick start guide

---

## 🎓 Learning Resources

- **Next.js App Router:** https://nextjs.org/docs/app
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Supabase:** https://supabase.com/docs
- **Playwright:** https://playwright.dev/docs/
- **Radix UI:** https://www.radix-ui.com/docs

---

**Remember:** This is a production-ready, well-documented codebase. Always maintain the high standards set by the original implementation and enhancements.

---

*Last Updated: October 31, 2025*
*Version: 2.0 (Post-LLM Enhancements)*
*Status: Production Ready*