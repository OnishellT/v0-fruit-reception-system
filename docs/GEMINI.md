# Gemini Project: Fruit Reception System

## Project Overview

This is a Next.js application for a fruit reception system. It allows users to manage receptions of fruit from various providers. The system includes features such as:

*   **Authentication:** A custom session-based authentication system with roles for "admin" and "operator".
*   **Reception Management:** Users can create, read, and update fruit receptions.
*   **Cash POS System:** A dedicated Point of Sale module for managing cash-based fruit receptions and payments.
*   **Provider Management:** Users can manage the providers who supply the fruit, including their **Certifications**.
*   **Driver Management:** Users can manage the drivers who transport the fruit.
*   **Fruit Type Management:** Users can manage the types of fruit that are received.
*   **Association Management:** Users can manage the associations that the providers belong to.
*   **Audit Logging:** All critical actions are logged for auditing purposes.
*   **Weight Discount System:** The system can automatically calculate weight discounts based on the quality of the fruit.
*   **Laboratory & Quality Control:** Comprehensive module for sample analysis, including moisture content, mold, and other quality metrics (Violetas, Moho, Basura).
*   **Cacao Processing Module**: Manages the processing of cacao from reception to dried product, including laboratory sample analysis and batch management.

The application uses a server-client hybrid architecture, with server components for data fetching and client components for interactivity. It uses **Supabase** for the database and **Drizzle ORM** for type-safe database interactions. **Playwright** is used for end-to-end testing.

## Building and Running

*   **Install dependencies:** `pnpm install`
*   **Run the development server:** `pnpm dev`
*   **Run the production server:** `pnpm start`
*   **Build the application:** `pnpm build`
*   **Run the linter:** `pnpm lint`
*   **Run the tests:** `pnpm test:all`
*   **Run specific tests:**
    *   `pnpm test:e2e-complete`: Complete E2E workflow
    *   `pnpm test:cash-pos-e2e`: Cash POS E2E tests
    *   `pnpm test:cacao-lab`: Cacao Lab tests

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for code formatting and linting.
*   **Database:** The project uses **Drizzle ORM** for schema definition and database queries. Schema is located in `lib/db/schema.ts`.
*   **Testing:** The project uses Playwright for end-to-end testing. All critical workflows are covered by tests.
*   **Data Model:** The project uses a relational data model defined in Drizzle, including tables for:
    *   **Core:** `users`, `audit_logs`
    *   **Partners:** `providers`, `drivers`, `asociaciones`, `certifications`
    *   **Operations:** `receptions`, `reception_details`, `cacao_batches`, `batch_receptions`
    *   **Quality & Lab:** `quality_evaluations`, `laboratory_samples`, `calidad_cafe`
    *   **Finance:** `pricing_rules`, `discount_thresholds`, `daily_prices`, `pricing_calculations`
*   **Authentication:** The project uses a custom session-based authentication system.
*   **Authorization:** The project uses role-based access control (RBAC) to restrict access to certain features.

## Active Technologies
- **Framework:** Next.js 16.0.0
- **Language:** TypeScript ^5
- **UI Library:** React 19.2.0
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM + Drizzle Kit
- **Styling:** Tailwind CSS v4, @radix-ui/*, Lucide React
- **Validation:** Zod, React Hook Form
- **Utilities:** date-fns, Recharts, jsPDF, html2canvas

## Recent Changes
- **Cash POS Module:** Added a dedicated module for cash operations (`app/dashboard/cash-pos`).
- **Drizzle ORM Migration:** Adopted Drizzle ORM for robust type-safe database interactions.
- **React 19 & Next.js 16:** Updated to the latest major versions of React and Next.js.
- **Enhanced Quality Control:** Added detailed laboratory sampling and quality evaluation tables.
