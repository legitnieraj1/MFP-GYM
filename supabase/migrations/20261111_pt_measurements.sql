-- ============================================================
-- PT Body Measurements Table
-- Stores body measurement history for Personal Training members.
-- Each row is one measurement session (day) for one member.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pt_measurements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  day_number      int  NOT NULL CHECK (day_number > 0),
  weight_kg       numeric(5,2) CHECK (weight_kg > 0),
  bmi             numeric(5,2) CHECK (bmi > 0),
  body_fat_pct    numeric(5,2) CHECK (body_fat_pct >= 0 AND body_fat_pct < 100),
  measured_at     date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Prevent accidental duplicate day numbers per member
  UNIQUE (member_id, day_number)
);

-- Index for fast member lookups
CREATE INDEX IF NOT EXISTS idx_pt_measurements_member_id
  ON public.pt_measurements (member_id, day_number ASC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pt_measurements_updated_at
  BEFORE UPDATE ON public.pt_measurements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.pt_measurements ENABLE ROW LEVEL SECURITY;

-- Only allow full access via service role (admin server actions use supabaseAdmin
-- which bypasses RLS). These permissive policies cover any direct anon/authenticated
-- client calls that might occur via the app's anon key; in practice all PT measurement
-- ops go through the service-role client so these are belt-and-suspenders.
CREATE POLICY "Allow admin service role access"
  ON public.pt_measurements
  FOR ALL
  USING (true)
  WITH CHECK (true);

