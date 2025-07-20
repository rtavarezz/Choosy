-- Update zip code constraint to support international postal codes
-- This allows various formats: US (12345), Canada (A1A 1A1), UK (SW1A 1AA), etc.

-- Drop the existing constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_zip_code_check;

-- Add the new constraint for international postal codes
ALTER TABLE plans ADD CONSTRAINT plans_zip_code_check 
  CHECK (zip_code ~ '^[A-Z0-9\s\-]{3,10}$');

-- Add comment for documentation
COMMENT ON CONSTRAINT plans_zip_code_check ON plans IS 'International postal code validation: 3-10 alphanumeric characters, spaces, hyphens'; 