# Simplification Plan

## Goal
Simplify the application's technology stack and architecture while maintaining 100% functionality, ensuring code cleanliness, and improving testability.

## 1. Runtime & Tooling: Switch to Bun
**Current**: Node.js + pnpm + tsx
**Proposed**: Bun

**Benefits**:
*   **Speed**: Bun is significantly faster for package installation and script execution.
*   **Simplicity**: Unified tool for runtime, package manager, and test runner. No need for `tsx` or `ts-node`.
*   **Compatibility**: Bun is largely compatible with Next.js and Node.js APIs.

**Action Items**:
1.  Install dependencies with `bun install`.
2.  Update `package.json` scripts to use `bun` instead of `node` or `next`.
3.  Delete `pnpm-lock.yaml` and commit `bun.lockb`.

## 2. Codebase Cleanup
**Current**: `package.json` contains scripts pointing to non-existent files (e.g., `tests/simple/simple-test.js`).
**Proposed**: Remove dead code and broken scripts.

**Action Items**:
1.  Audit `package.json` scripts.
2.  Remove scripts referencing missing files in `tests/`.
3.  Delete unused test files if they are obsolete.

## 3. Architecture: Server Actions over API Routes
**Current**: Hybrid of Server Components and API Routes (`app/api`).
**Proposed**: Prioritize Server Actions for mutations.

**Benefits**:
*   **Type Safety**: Direct function calls with type inference.
*   **Less Boilerplate**: No need for `fetch`, request parsing, or response serialization.
*   **Co-location**: Keep logic closer to the UI components that trigger it.

**Action Items**:
1.  Identify API routes used for form submissions or simple mutations.
2.  Refactor them into Server Actions (`app/actions/*.ts`).
3.  Update client components to call actions directly.

## 4. Testing Strategy
**Current**: Custom Node.js scripts and Playwright.
**Proposed**: Standardize on Playwright for E2E and Bun Test for unit/integration.

**Action Items**:
1.  Use `bun test` for any pure logic tests (e.g., utility functions).
2.  Keep Playwright for full application workflows (it works well with Bun).

## 5. Dependency Reduction
**Current**: Tailwind v4 (Alpha/Beta?) + PostCSS.
**Proposed**: Ensure configuration is minimal.

**Action Items**:
1.  Verify if `postcss.config.mjs` is strictly necessary with the latest Tailwind v4 Next.js integration.

## Execution Steps
1.  **Phase 1**: Cleanup `package.json` and remove broken references.
2.  **Phase 2**: Migrate to Bun (install & lockfile).
3.  **Phase 3**: Verify application functionality (`bun dev`, `bun run test:e2e-complete`).

## Alternative: Rewrite with SolidJS + TanStack
The user suggested migrating to **SolidJS**, **TanStack** (Start/Router/Query), and **shadcn-solid**.

### Feasibility Analysis
*   **Feasible**: Yes, but it constitutes a **complete rewrite** of the frontend and routing layer.
*   **Effort**: High. The project has ~150 React files (`app/` and `components/`) that must be manually ported to SolidJS syntax (Signals vs Hooks, `<For>` vs `.map`, etc.).
*   **UI Library**: `shadcn-ui` is native to React. While `shadcn-solid` (unofficial port) exists, it may not have 100% parity.
*   **Backend**: The Drizzle/Supabase backend logic (`lib/db`) is reusable, but Next.js specific API routes and Middleware would need to be adapted to the new meta-framework (e.g., SolidStart or TanStack Start).

### Trade-offs
| Feature | Next.js (Current) | SolidJS + TanStack (Proposed) |
| :--- | :--- | :--- |
| **Reactivity** | VDOM (React) | Fine-grained Signals (Solid) |
| **Performance** | Good (with optimizations) | Excellent (native performance) |
| **Migration Cost** | Low (Refactor) | **Very High (Rewrite)** |
| **Ecosystem** | Massive (React) | Growing (Solid) |
| **Code Sharing** | 100% (Current) | ~40% (Logic/DB only) |

**Recommendation**: Unless there is a critical performance bottleneck or a strong desire to move away from React's model, the **Bun + Cleanup** path is significantly more efficient for "simplification" without losing stability. If a rewrite is desired, it should be treated as a new project phase.
