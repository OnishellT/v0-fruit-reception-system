-- TEMPORARY FIX: Disable Row Level Security for Testing
-- Run this in Supabase SQL Editor to enable CRUD operations
-- WARNING: This disables security! Only use for testing!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE receptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reception_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE asociaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_certifications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'providers', 'drivers', 'fruit_types', 'receptions', 'reception_details', 'audit_logs', 'asociaciones', 'certifications', 'provider_certifications');
