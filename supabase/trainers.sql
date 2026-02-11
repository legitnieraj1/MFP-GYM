-- Create Trainers Table
create table public.trainers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  specialty text not null,
  experience text not null,
  image_url text,
  social_links jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.trainers enable row level security;

-- Policies
create policy "Public can view trainers" 
  on public.trainers for select 
  using (true);

create policy "Admins can manage trainers" 
  on public.trainers for all 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));
