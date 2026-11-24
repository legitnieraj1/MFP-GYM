-- Add is_absent column to pt_measurements table
-- Allows recording that a PT candidate did not attend the gym on a particular day
-- without requiring weight/BMI/body fat measurements.
ALTER TABLE pt_measurements 
ADD COLUMN IF NOT EXISTS is_absent BOOLEAN NOT NULL DEFAULT false;
