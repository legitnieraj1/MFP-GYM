ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription jsonb;
