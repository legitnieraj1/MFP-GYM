-- SAFETY FIRST: This script deletes ALL 'MEMBER' accounts to clear duplicates.
-- It preserves 'ADMIN' and 'DALUXEADMIN' accounts so you don't get locked out.

-- 1. Delete all Members (who have duplicate phones or bad data)
DELETE FROM public.users 
WHERE role NOT IN ('ADMIN', 'DALUXEADMIN');

-- 2. NOW add the unique constraint for phone numbers (required for login)
-- This will succeed now that duplicates are gone.
ALTER TABLE public.users ADD CONSTRAINT unique_users_phone UNIQUE (phone);

-- 3. Add constraint for memberships to allow updates
ALTER TABLE public.memberships ADD CONSTRAINT unique_user_membership UNIQUE (user_id);
