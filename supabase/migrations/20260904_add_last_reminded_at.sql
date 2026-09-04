-- Track when a renewal reminder was last sent to a member (bulk reminder flow).
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;

-- Speed up the expired-members query (filters/sorts by membership_end).
CREATE INDEX IF NOT EXISTS idx_members_membership_end ON public.members(membership_end);
