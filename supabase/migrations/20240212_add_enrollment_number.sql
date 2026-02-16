-- Add enrollment_number column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS enrollment_number TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_enrollment_number ON public.users(enrollment_number);

-- Ensure phone number is unique if not already (it should be as it's the auth key now)
-- ALTER TABLE public.users ADD CONSTRAINT unique_phone UNIQUE (phone);
