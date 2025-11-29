# Qwik & Qwik City Migration Plan

## Overview
This document outlines the strategy to rewrite the "Fruit Reception System" using **Qwik** and **Qwik City** (Meta-framework) running on **Bun**.

## Goals
1.  **Simplification**: Leverage Qwik's *Resumability* to eliminate hydration overhead and simplify state management.
2.  **Performance**: Achieve instant-on interactivity.
3.  **Modern Stack**: Bun + Qwik + Drizzle ORM + Supabase.
4.  **Clean Architecture**: Use Qwik City's `routeLoader$` and `routeAction$` (Server Actions) to replace API routes.

## Technology Stack
*   **Framework**: [Qwik City](https://qwik.builder.io/qwikcity/overview/)
*   **Runtime**: [Bun](https://bun.sh)
*   **Language**: TypeScript
*   **Database**: Supabase + Drizzle ORM (Reused)
*   **UI Library**: [Flowbite Qwik](https://flowbite-qwik.com/) (Tailwind-based components).
*   **Testing**: Playwright (Reused) + Vitest (via Bun).

## Feasibility Analysis
*   **Feasibility**: **High**. Qwik City's data loading patterns (`loader$`, `action$`) map perfectly to the "Server Actions" improvement goal.
*   **Database**: Drizzle ORM is fully compatible with Qwik's server-side execution.
*   **UI**: **Flowbite Qwik** provides a comprehensive set of pre-built components (Tables, Modals, Forms) that will speed up the porting process significantly compared to building from scratch.

## Migration Phases

### Phase 1: Preparation & Backup
1.  **Backup**: Move current `app/`, `components/`, `lib/`, `public/` to `_legacy_backup/`.
2.  **Runtime**: Switch environment to Bun.
3.  **Init**: Initialize a new Qwik City project (`bun create qwik`).

### Phase 2: Foundation
1.  **Configuration**: Setup `vite.config.ts` (Qwik uses Vite), `bun.lockb`.
2.  **Database**: Restore `lib/db/` and configure database connection singleton for Qwik.
3.  **Auth**: Implement session management using Qwik City's `plugin@auth` or custom cookie-based middleware.
4.  **Styles**: Configure Tailwind CSS.

### Phase 3: Core Features (The "Rewrite")
*   **Routing**: Move from `app/` (Next.js) to `src/routes/` (Qwik City).
*   **Data Fetching**: Replace React Server Components/`useEffect` with `routeLoader$`.
*   **Mutations**: Replace API routes with `routeAction$`.
*   **State**: Use `useSignal` and `useStore` instead of `useState`.

### Phase 4: Module Porting
*   **Partners**: Port CRUD tables to Qwik components.
*   **Receptions**: Re-implement complex forms using `modular-forms` (Qwik ecosystem) or native forms with `routeAction$`.
*   **Cash POS**: Port the POS UI. *Benefit: Qwik's fine-grained reactivity is excellent for complex dashboards.*

### Phase 5: Verification
1.  **E2E Tests**: Run existing Playwright tests.
2.  **Unit Tests**: Use `bun test` or Vitest.

## Directory Structure (Target)
```
/
├── src/
│   ├── components/     # Qwik Components
│   ├── lib/           # Database & Utils (Reused)
│   ├── routes/        # File-based routing (Qwik City)
│   │   ├── index.tsx
│   │   ├── layout.tsx
│   │   └── dashboard/
│   ├── root.tsx
│   └── entry.ssr.tsx
├── drizzle/           # Migrations (Reused)
├── public/            # Static assets
├── tests/             # Playwright tests
└── package.json
```

## Immediate Next Steps
1.  Approve this plan.
2.  Execute **Phase 1** (Backup & Init).
