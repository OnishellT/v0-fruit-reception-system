-- Add batch result columns to receptions table
ALTER TABLE receptions
ADD COLUMN f_dried_kg DECIMAL,
ADD COLUMN f_batch_id UUID REFERENCES cacao_batches(id);

-- Add comment for documentation
COMMENT ON COLUMN receptions.f_dried_kg IS 'Final dried weight from batch processing (kg)';
COMMENT ON COLUMN receptions.f_batch_id IS 'Reference to the batch that processed this reception';