-- Create OTP codes table
create table if not exists otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  attempts int default 0,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Index for fast lookup by phone
create index if not exists idx_otp_codes_phone on otp_codes(phone);
