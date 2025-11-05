-- Migration: Set all quality discount thresholds to 15% baseline limit
-- Date: 2025-11-02
-- Description: Updates all existing discount thresholds to use a 15% quality limit

-- Update all existing thresholds to have a 15% limit
UPDATE discount_thresholds SET limit_value = 15.00 WHERE limit_value IS NOT NULL;

-- If there are any thresholds that don't have limit_value set (shouldn't happen after migration 40),
-- set them to 15% as well
UPDATE discount_thresholds SET limit_value = 15.00 WHERE limit_value IS NULL;

-- Log the changes
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count FROM discount_thresholds WHERE limit_value = 15.00;
    RAISE NOTICE 'Updated % discount thresholds to 15%% limit', updated_count;
END $$;