-- Add synced_to_dashboard column to receptions table
-- This column tracks which receptions have been included in daily stats

ALTER TABLE receptions
ADD COLUMN synced_to_dashboard BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_receptions_synced_dashboard ON receptions (synced_to_dashboard, created_at);

-- Update existing receptions to be marked as synced (since they're already in the database)
UPDATE receptions
SET synced_to_dashboard = TRUE
WHERE synced_to_dashboard = FALSE;

-- Add comment
COMMENT ON COLUMN receptions.synced_to_dashboard IS 'Tracks whether this reception has been synced to the daily dashboard stats';
