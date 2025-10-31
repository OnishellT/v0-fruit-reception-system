-- Migration: Add soft delete support to all tables
-- This allows records to be "deleted" without breaking foreign key constraints

-- Add deleted_at column to providers
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to drivers
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to fruit_types
ALTER TABLE fruit_types
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to asociaciones
ALTER TABLE asociaciones
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index on deleted_at for better performance
CREATE INDEX IF NOT EXISTS idx_providers_deleted_at ON providers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_drivers_deleted_at ON drivers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fruit_types_deleted_at ON fruit_types(deleted_at);
CREATE INDEX IF NOT EXISTS idx_asociaciones_deleted_at ON asociaciones(deleted_at);
