-- 1. Update the Check Constraint for 'role'
-- We need to drop the existing constraint and add a new one that includes 'DALUXEADMIN'
-- (and 'ADMIN' just in case we have legacy data, but user wants to use DALUXEADMIN)

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'MEMBER', 'DALUXEADMIN'));

-- 2. Update RLS Policies to allow DALUXEADMIN
-- We need to update the "Admins can..." policies to check for DALUXEADMIN as well.

-- Policy: Admins (DALUXEADMIN) can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
CREATE POLICY "Admins can update all profiles"
ON public.users FOR UPDATE
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'DALUXEADMIN')
);

-- Memberships Policies
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
CREATE POLICY "Admins can view all memberships" ON public.memberships FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

DROP POLICY IF EXISTS "Admins can insert memberships" ON public.memberships;
CREATE POLICY "Admins can insert memberships" ON public.memberships FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
CREATE POLICY "Admins can update memberships" ON public.memberships FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

-- Attendance Policies
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

DROP POLICY IF EXISTS "Admins can insert attendance" ON public.attendance;
CREATE POLICY "Admins can insert attendance" ON public.attendance FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

-- Payments Policies
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

DROP POLICY IF EXISTS "Admins can insert payments" ON public.payments;
CREATE POLICY "Admins can insert payments" ON public.payments FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

-- Diet Plans Policies
DROP POLICY IF EXISTS "Admins can view all diet plans" ON public.diet_plans;
CREATE POLICY "Admins can view all diet plans" ON public.diet_plans FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));

DROP POLICY IF EXISTS "Admins can insert/update diet plans" ON public.diet_plans;
CREATE POLICY "Admins can insert/update diet plans" ON public.diet_plans FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'DALUXEADMIN')));
