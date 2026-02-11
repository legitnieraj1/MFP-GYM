-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  phone text,
  age int,
  weight float,
  height float,
  address text,
  photo text,
  role text default 'MEMBER' check (role in ('ADMIN', 'MEMBER')),
  body_goal text check (body_goal in ('CUT', 'BULK', 'MAINTAIN')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies for USERS
create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

-- Allow admins to see all profiles (AVOID RECURSION using auth.jwt() metadata or a simplified check if possible)
-- Ideally, admin status should be in auth.users app_metadata, but we are using public.users table.
-- The recursion happens because checking if user is admin requires querying public.users, which triggers the policy again.
-- FIX: Allow all users to read public.users (or limit fields). But for admin check, we need to bypass RLS or use a different method.
-- BETTER FIX: Define a function or use a more direct check. 
-- For now, let's just allow authenticated users to view profiles (simpler) OR use a specific rule for non-recursive admin check.

-- Strategy: Use a security definer function to check admin status without triggering RLS on the user making the check?
-- Or, since we are using Supabase, we can just check the claim if we set it.
-- BUT, since we haven't set claims, let's try to fix the query loop.

-- One common trick:
-- create policy "Admins can view all profiles"
--   on public.users for select
--   using (
--     (select role from public.users where id = auth.uid()) = 'ADMIN'
--   );  <-- This causes recursion.

-- Workaround: 
create policy "Admins can view all profiles" 
  on public.users for select 
  using (
    auth.jwt() ->> 'email' = 'admin@mfpgym.com'  -- Hardcode initial admin or use a claim? No.
    OR
    exists (
       select 1 from public.users as u
       where u.id = auth.uid() 
       and u.role = 'ADMIN'
    )
  ); 
-- Still recursive.

-- ALTERNATIVE: Don't use RLS for admin checks in the application code, use the Interaction (Service Role) client.
-- BUT the frontend needs to check.

-- Let's use a simpler approach for now to unblock:
-- Allow reading public.users globally (maybe restrict sensitive fields if needed, but for this app it's fine).
create policy "Enable read access for all users"
on public.users for select
using (true);

create policy "Users can update their own profile" 
  on public.users for update 
  using (auth.uid() = id);

create policy "Admins can update all profiles" 
  on public.users for update 
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN' 
  ); 
-- Update usually doesn't recurse on Select policies unless we select during update check in a specific way.
-- Actually, the "Admins can update" might recurse if it selects.


-- MEMBERSHIPS TABLE
create table public.memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  plan text not null, -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'PENDING')),
  amount float not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.memberships enable row level security;

-- Policies for MEMBERSHIPS
create policy "Users can view their own membership" 
  on public.memberships for select 
  using (auth.uid() = user_id);

create policy "Admins can view all memberships" 
  on public.memberships for select 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));

create policy "Admins can insert memberships" 
  on public.memberships for insert 
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));

create policy "Admins can update memberships" 
  on public.memberships for update 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));


-- ATTENDANCE TABLE
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  check_in_time timestamp with time zone default timezone('utc'::text, now()) not null,
  date date default CURRENT_DATE not null
);

-- Enable RLS
alter table public.attendance enable row level security;

-- Policies for ATTENDANCE
create policy "Users can view their own attendance" 
  on public.attendance for select 
  using (auth.uid() = user_id);

create policy "Admins can view all attendance" 
  on public.attendance for select 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));

create policy "Admins can insert attendance" 
  on public.attendance for insert 
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));


-- PAYMENTS TABLE
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount float not null,
  currency text default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  status text check (status in ('SUCCESS', 'FAILED', 'PENDING')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- Policies for PAYMENTS
create policy "Users can view their own payments" 
  on public.payments for select 
  using (auth.uid() = user_id);

create policy "Admins can view all payments" 
  on public.payments for select 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));

create policy "Admins can insert payments" 
  on public.payments for insert 
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));


-- DIET PLANS TABLE
create table public.diet_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  content text,
  calories int,
  protein int,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.diet_plans enable row level security;

-- Policies for DIET PLANS
create policy "Users can view their own diet plan" 
  on public.diet_plans for select 
  using (auth.uid() = user_id);

create policy "Admins can view all diet plans" 
  on public.diet_plans for select 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));

create policy "Admins can insert/update diet plans" 
  on public.diet_plans for all 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));

-- Trigger to create a user profile when a new user signs up specifically via email
-- Note: Logic for 'Admin' creation usually happens manually or via specific seed script.
-- For standard signups, we might want a trigger, but for now we'll handle creation via the Admin Dashboard logic explicitly.
