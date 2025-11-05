# Gemini Project: Fruit Reception System

## Project Overview

This is a Next.js application for a fruit reception system. It allows users to manage receptions of fruit from various providers. The system includes features such as:

*   **Authentication:** A custom session-based authentication system with roles for "admin" and "operator".
*   **Reception Management:** Users can create, read, and update fruit receptions.
*   **Provider Management:** Users can manage the providers who supply the fruit.
*   **Driver Management:** Users can manage the drivers who transport the fruit.
*   **Fruit Type Management:** Users can manage the types of fruit that are received.
*   **Association Management:** Users can manage the associations that the providers belong to.
*   **Audit Logging:** All critical actions are logged for auditing purposes.
*   **Weight Discount System:** The system can automatically calculate weight discounts based on the quality of the fruit.
*   **Cacao Processing Module**: Manages the processing of cacao from reception to dried product, including laboratory sample analysis and batch management.

The application uses a server-client hybrid architecture, with server components for data fetching and client components for interactivity. It uses Supabase for the database and Playwright for end-to-end testing.

## Building and Running

*   **Install dependencies:** `pnpm install`
*   **Run the development server:** `pnpm dev`
*   **Run the production server:** `pnpm start`
*   **Build the application:** `pnpm build`
*   **Run the linter:** `pnpm lint`
*   **Run the tests:** `pnpm test:all`

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for code formatting and linting.
*   **Testing:** The project uses Playwright for end-to-end testing. All critical workflows are covered by tests.
*   **Data Model:** The project uses a relational data model, with tables for users, providers, drivers, fruit types, associations, receptions, reception details, and audit logs.
*   **Authentication:** The project uses a custom session-based authentication system.
*   **Authorization:** The project uses role-based access control (RBAC) to restrict access to certain features.

## Active Technologies
- TypeScript ^5, Next.js 16.0.0 + next, react, supabase, zod, @radix-ui/*, tailwindcss (004-cacao-processing-module)
- Supabase (PostgreSQL) (004-cacao-processing-module)

## Recent Changes
- 004-cacao-processing-module: Added TypeScript ^5, Next.js 16.0.0 + next, react, supabase, zod, @radix-ui/*, tailwindcss
