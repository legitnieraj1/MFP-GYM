-- 1. Make email optional (Running this multiple times is safe)
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 2. Add Phone Unique Constraint (Only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_users_phone') THEN
    ALTER TABLE public.users ADD CONSTRAINT unique_users_phone UNIQUE (phone);
  END IF;
END $$;

-- 3. Add Membership Unique Constraint (Only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_membership') THEN
    ALTER TABLE public.memberships ADD CONSTRAINT unique_user_membership UNIQUE (user_id);
  END IF;
END $$;
