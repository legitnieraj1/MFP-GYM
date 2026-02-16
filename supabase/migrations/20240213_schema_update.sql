-- 1. Make email optional in public.users
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 2. Ensure phone is unique in public.users (good practice for phone-based auth)
-- This might fail if duplicates exist, but it's essential for your login flow.
ALTER TABLE public.users ADD CONSTRAINT unique_users_phone UNIQUE (phone);

-- 3. Add unique constraint to memberships to allow UPSERT on user_id
-- This ensures one membership record per user (or enables easy updating of the current one).
ALTER TABLE public.memberships ADD CONSTRAINT unique_user_membership UNIQUE (user_id);
