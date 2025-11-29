import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgres://postgres.cukuknkjwpmzcxyidcao:QJmxuwiID5SToBLR@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable';

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;