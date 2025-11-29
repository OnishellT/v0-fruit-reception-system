import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgres://postgres.cukuknkjwpmzcxyidcao:QJmxuwiID5SToBLR@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable',
  },
  verbose: true,
  strict: true,
});