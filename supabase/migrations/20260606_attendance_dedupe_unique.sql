-- Fix attendance double-tap race conditions.
--
-- Root cause: there was no DB-level guarantee of one attendance row per member
-- per day, so two near-simultaneous NFC/QR taps could each INSERT a row. The
-- duplicate rows then made `maybeSingle()` throw and broke check-in/check-out
-- detection ("already checked in" on first tap, "checked in" on check-out).
--
-- This migration:
--   1. Collapses existing duplicate (user_id, date) rows.
--   2. Adds a unique index so duplicates can never be created again. The app
--      relies on the resulting unique_violation (SQLSTATE 23505) to make
--      check-in idempotent.

-- 1. Merge duplicates: keep the earliest check-in and the latest check-out
--    for each (user_id, date), then delete the extra rows.
with merged as (
  select
    user_id,
    date,
    min(check_in_time)  as first_in,
    max(check_out_time) as last_out
  from public.attendance
  group by user_id, date
  having count(*) > 1
),
keep as (
  select distinct on (a.user_id, a.date) a.id
  from public.attendance a
  join merged m on m.user_id = a.user_id and m.date = a.date
  order by a.user_id, a.date, a.check_in_time asc
)
update public.attendance a
set check_in_time  = m.first_in,
    check_out_time = m.last_out
from merged m
join keep k on true
where a.id = k.id
  and a.user_id = m.user_id
  and a.date = m.date;

delete from public.attendance a
using (
  select id,
         row_number() over (
           partition by user_id, date
           order by check_in_time asc
         ) as rn
  from public.attendance
) d
where a.id = d.id
  and d.rn > 1;

-- 2. Enforce one row per member per day.
create unique index if not exists attendance_user_date_uniq
  on public.attendance (user_id, date);
