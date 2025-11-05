-- Simple migration to rename f_dried_kg to total_peso_dried
DO $$
BEGIN
    -- Check if f_dried_kg column exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'receptions'
        AND column_name = 'f_dried_kg'
    ) THEN
        ALTER TABLE receptions RENAME COLUMN f_dried_kg TO total_peso_dried;
        RAISE NOTICE 'Renamed f_dried_kg to total_peso_dried';
    ELSE
        RAISE NOTICE 'f_dried_kg column not found or already renamed';
    END IF;

    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_schema = 'public'
        AND constraint_name = 'chk_peso_dried_nonnegative'
    ) THEN
        ALTER TABLE receptions
        ADD CONSTRAINT chk_peso_dried_nonnegative CHECK (total_peso_dried >= 0);
        RAISE NOTICE 'Added constraint chk_peso_dried_nonnegative';
    END IF;
END $$;