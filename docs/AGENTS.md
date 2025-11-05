# Development Guidelines for v0-fruit-reception-system

## Commands
- `npm run lint` - Run ESLint
- `npm run build` - Build for production  
- `npm test` - Run basic auth test
- `npm run test:all` - Run all tests via shell script
- `npm run test:comprehensive` - Run comprehensive test suite
- `npm run test:crud` - Run CRUD operations test
- `npm run test:reception` - Run reception test
- `npm run test:reception:create` - Run reception creation test

## Code Style
- TypeScript 5.0.2 with strict mode enabled
- Use `@/*` path aliases for imports
- React components use PascalCase, files use kebab-case
- Use `cn()` utility for Tailwind class merging
- Follow Radix UI patterns for components
- Zod for schema validation
- Error handling with try/catch and proper TypeScript types
- No default exports, prefer named exports
- Use class-variance-authority (cva) for component variants