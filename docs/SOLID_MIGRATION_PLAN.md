# SolidStart Migration Plan

## Overview
This document outlines the strategy to rewrite the "Fruit Reception System" using **SolidStart** (SolidJS) while maintaining 100% functionality and adopting **Bun** as the runtime.

## Feasibility Analysis
*   **Feasibility**: **High**. The application's core logic relies heavily on Drizzle ORM and Supabase, which are framework-agnostic.
*   **Challenge**: The UI layer must be rewritten from React (Hooks/VDOM) to SolidJS (Signals/Fine-grained reactivity).
*   **Risk**: Regression in complex flows (e.g., Cash POS). Mitigated by existing Playwright E2E tests.

## Technology Stack
*   **Framework**: [SolidStart](https://start.solidjs.com) (Vite-based)
*   **Runtime**: [Bun](https://bun.sh)
*   **Language**: TypeScript
*   **Database**: Supabase + Drizzle ORM (Reused)
*   **UI Library**: [shadcn-solid](https://shadcn-solid.com) (Port of shadcn/ui) + Tailwind CSS
*   **Testing**: Playwright (Reused) + Bun Test

## Migration Phases

### Phase 1: Preparation & Backup
1.  **Backup**: Move current `app/`, `components/`, `lib/`, `public/` to `_legacy_backup/`.
2.  **Runtime**: Switch environment to Bun.
3.  **Clean Slate**: Initialize a new SolidStart project in the root.

### Phase 2: Foundation
1.  **Configuration**: Setup `vite.config.ts`, `tsconfig.json`, and `tailwind.config.ts`.
2.  **Database**: Restore `lib/db/` (Drizzle schema and connection). Ensure compatibility.
3.  **Auth**: Implement SolidStart Middleware for session management (replacing Next.js Middleware).
4.  **UI System**: Install `shadcn-solid` and configure base theme (fonts, colors).

### Phase 3: Core Features (The "Rewrite")
*   **Authentication**: Port Login page and Session logic.
*   **Layouts**: Create Dashboard layout (Sidebar, Header) using Solid components.
*   **Routing**: Define file-based routes in `src/routes` (SolidStart convention).

### Phase 4: Module Porting
*   **Partners**: Providers, Drivers, Associations.
*   **Receptions**: Create/Edit flows. *Complex: Forms need conversion to Solid patterns.*
*   **Cash POS**: *Critical*. Port the POS interface. High attention to reactivity.
*   **Quality/Lab**: Port the new Lab modules.

### Phase 5: Verification
1.  **Unit Tests**: Write `bun test` for utilities.
2.  **E2E Tests**: Run existing Playwright tests. *Note: Selectors might need minor updates if class names change.*

## Directory Structure (Target)
```
/
├── src/
│   ├── components/     # UI Components (shadcn-solid)
│   ├── lib/           # Database & Utils (Reused)
│   ├── routes/        # File-based routing (SolidStart)
│   ├── entry-client.tsx
│   └── entry-server.tsx
├── drizzle/           # Migrations (Reused)
├── public/            # Static assets
├── tests/             # Playwright tests
└── package.json
```

## Immediate Next Steps
1.  Approve this plan.
2.  Execute **Phase 1** (Backup & Init).
