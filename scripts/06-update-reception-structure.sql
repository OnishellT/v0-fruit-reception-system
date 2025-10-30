-- Add fruit_type_id to receptions table
ALTER TABLE receptions
ADD COLUMN fruit_type_id UUID REFERENCES fruit_types(id);

-- Add comment explaining the structure
COMMENT ON COLUMN receptions.fruit_type_id IS 'All details in this reception will use this fruit type';

-- Update existing receptions to set fruit_type_id from their first detail (if any exist)
UPDATE receptions r
SET fruit_type_id = (
  SELECT fruit_type_id 
  FROM reception_details 
  WHERE reception_id = r.id 
  ORDER BY line_number 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM reception_details WHERE reception_id = r.id
);
