-- Tracks automated WhatsApp expiry-reminder sends, keyed by the membership_end
-- date they were sent for. Storing the date (not just a timestamp) lets the
-- cron job tell "already notified for this membership cycle" apart from
-- "member renewed, this is a new cycle" without a separate reset step —
-- renewal changes membership_end, so the old notified date stops matching.
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS auto_pre_expiry_notified_for DATE,
ADD COLUMN IF NOT EXISTS auto_expiry_notified_for DATE;
