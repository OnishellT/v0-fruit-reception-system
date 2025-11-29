-- Migration: Update cash_reception_details to simplified model
-- Date: 2025-11-27
-- Description: Simplifies weighing model to just containers count and weight (no tare/gross)

-- Drop existing table if it exists
DROP TABLE IF EXISTS cash_reception_details CASCADE;

-- Create simplified cash_reception_details table
CREATE TABLE IF NOT EXISTS cash_reception_details (
  id SERIAL PRIMARY KEY,
  reception_id INTEGER NOT NULL REFERENCES cash_receptions(id) ON DELETE CASCADE,
  weighing_number INTEGER NOT NULL,
  containers_count INTEGER NOT NULL,
  weight_kg NUMERIC(12, 3) NOT NULL,
  notes VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add unique constraint to prevent duplicate weighing numbers per reception
CREATE UNIQUE INDEX IF NOT EXISTS cash_reception_details_unique_weighing 
ON cash_reception_details(reception_id, weighing_number);

-- Add index for faster queries by reception
CREATE INDEX IF NOT EXISTS cash_reception_details_reception_id_idx 
ON cash_reception_details(reception_id);

-- Add index for ordering by weighing number
CREATE INDEX IF NOT EXISTS cash_reception_details_weighing_number_idx 
ON cash_reception_details(reception_id, weighing_number);
