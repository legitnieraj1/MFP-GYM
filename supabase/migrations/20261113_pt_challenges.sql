-- ============================================================
-- PT Challenge Candidates Table
-- Manages candidate assignments to 90 Days and 120 Days challenges.
-- Each candidate belongs to either 90_DAYS or 120_DAYS challenge.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pt_challenge_candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  challenge_type  text NOT NULL CHECK (challenge_type IN ('90_DAYS', '120_DAYS')),
  start_date      date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Prevent assigning the same candidate to both challenges simultaneously
  UNIQUE (member_id)
);

-- Index for querying by challenge type and start date
CREATE INDEX IF NOT EXISTS idx_pt_challenge_candidates_challenge
  ON public.pt_challenge_candidates (challenge_type, start_date);

-- Index for fast member lookups
CREATE INDEX IF NOT EXISTS idx_pt_challenge_candidates_member
  ON public.pt_challenge_candidates (member_id);

-- Add challenge_type to pt_measurements if not exists
ALTER TABLE public.pt_measurements
  ADD COLUMN IF NOT EXISTS challenge_type text CHECK (challenge_type IN ('90_DAYS', '120_DAYS'));

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS pt_challenge_candidates_updated_at ON public.pt_challenge_candidates;
CREATE TRIGGER pt_challenge_candidates_updated_at
  BEFORE UPDATE ON public.pt_challenge_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.pt_challenge_candidates ENABLE ROW LEVEL SECURITY;

-- Allow service role / admin client full access
CREATE POLICY "Allow admin access to challenge candidates"
  ON public.pt_challenge_candidates
  FOR ALL
  USING (true)
  WITH CHECK (true);

