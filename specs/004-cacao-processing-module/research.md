# Research: Cacao Processing Batches & Laboratory Samples

**Branch**: `004-cacao-processing-module` | **Date**: 2025-11-01 | **Spec**: [/home/dev/Documents/v0-fruit-reception-system/specs/004-cacao-processing-module/spec.md]

This document summarizes the research findings for the Cacao Processing feature.

## 1. Technical Context Clarification

### 1.1. Performance Goals

*   **Decision**:
    *   UI response time for common operations: < 3 seconds.
    *   Batch processing completion: Asynchronous, with notifications. Time depends on batch size.
    *   Report generation: < 1 minute for most reports, with async options for large ones.
    *   Throughput: Handle hundreds of samples and multiple concurrent batches daily.
    *   Availability: 99.9% uptime.
*   **Rationale**: Based on industry standards for similar applications managing agricultural and lab data. The system needs to be responsive for users while handling potentially long-running background tasks.
*   **Alternatives considered**: Stricter real-time processing was considered but deemed unnecessary for the core batch processing workflow, which is not typically a real-time activity.

### 1.2. Constraints

*   **Decision**:
    *   Data Volume: System must handle large datasets with diverse data types from lab instruments.
    *   Regulatory: Must support traceability and audit trails for compliance (e.g., HACCP, ISO 22000).
    *   Integration: Plan for future integration with lab instruments and other systems (ERP).
    *   Network: The application should be tolerant of intermittent network connectivity in remote areas.
    *   Security: Implement role-based access control (RBAC).
*   **Rationale**: These constraints are critical for a system managing agricultural data, where traceability, compliance, and data integrity are paramount.
*   **Alternatives considered**: A less constrained model was rejected as it would not meet the fundamental business requirements of the agricultural sector.

### 1.3. Scale/Scope

*   **Decision**:
    *   User Base: Design for 50-100 concurrent users initially, with the ability to scale.
    *   Data Volume: Support storage and querying of several years of historical data.
    *   Geographic: Support multiple locations (farms, labs).
    *   Functional Growth: The architecture should be modular to accommodate future features.
*   **Rationale**: The system should be built with future growth in mind, both in terms of users and data, as well as functionality.
*   **Alternatives considered**: Building for the current scale only was rejected as it would lead to costly refactoring in the future.

## 2. Best Practices Research

### 2.1. Next.js for Data-Intensive Applications

*   **Findings**:
    *   **Data Fetching**: Use Server Components for most data fetching to improve security and performance. Use `getServerSideProps` for dynamic data and `getStaticProps` for static data. Use client-side fetching with SWR or React Query for data that changes frequently.
    *   **Performance**: Optimize images with `next/image`. Use code splitting and dynamic imports to reduce bundle size. Implement caching at various levels (client, server, CDN). Use virtual lists for large datasets.
    *   **Scalability**: Modularize API routes and keep them lean. Use a well-defined folder structure. Implement automated testing and CI/CD. Offload heavy computations to background jobs.

### 2.2. React Forms with Zod Validation

*   **Findings**:
    *   **Use React Hook Form**: It's the recommended library for integrating with Zod due to its performance and developer experience.
    *   **Define Clear Schemas**: Create separate files for Zod schemas with descriptive names, and use `.refine()` for complex validation and custom error messages.
    *   **Integrate with `@hookform/resolvers/zod`**: This package makes it easy to use Zod schemas with React Hook Form.
    *   **Display Errors Clearly**: Show inline error messages and use ARIA attributes for accessibility.
    *   **Handle Form State**: Use `isSubmitting` to provide feedback to the user during form submission.
    *   **Create Reusable Components**: Build custom input components to encapsulate label, input, and error display logic.
    *   **Always Validate on the Server**: Never rely solely on client-side validation.

### 2.3. Supabase Data Modeling

*   **Findings**:
    *   **Use Foreign Keys**: Enforce referential integrity between related entities using foreign keys.
    *   **One-to-Many**: For the relationship between `batches` and `receptions` (one batch can have many receptions), add a `batch_id` foreign key to a linking table, not directly to the `receptions` table as a reception can exist without a batch. A `batch_receptions` table would be better to link them.
    *   **One-to-One**: For the relationship between `receptions` and `laboratory_samples`, add a `reception_id` foreign key to the `laboratory_samples` table and enforce a unique constraint on it.
    *   **Use `ON DELETE` actions**: To maintain data consistency when a referenced row is deleted.
    *   **Use RLS**: Implement Row Level Security to control access to data.

*   **Findings**:
    *   **Embrace Headless Components**: Use Radix UI primitives and apply styling with Tailwind CSS.
    *   **Prioritize Accessibility**: Don't break Radix's built-in accessibility features.
    *   **Use `tailwind.config.js`**: To extend and customize the design system.
    *   **Direct `className` Application**: Pass Tailwind utility classes directly to the `className` prop of Radix primitives.
    *   **Create Wrapper Components**: For complex or frequently used patterns, create wrapper components that encapsulate both Radix primitives and Tailwind styling.
    *   **Use `asChild` prop**: To merge props and event handlers correctly when using custom components as triggers.

### 2.5. Tailwind CSS in Large-Scale Applications

*   **Research Task**: Find best practices for using Tailwind CSS in a large-scale application.
*   **Findings**:
    *   **Utility-First Mindset**: Stick to the utility-first approach and avoid creating custom CSS classes unless necessary.
    *   **Configuration and Customization**: Leverage `tailwind.config.js` to define your design system.
    *   **Extract Components**: For highly repetitive blocks of utilities, extract them into reusable React components.
    *   **Performance Optimization**: Use JIT mode to only generate the CSS you actually use.
    *   **Linting and Formatting**: Use ESLint with a Prettier plugin to automatically sort and format Tailwind classes.
