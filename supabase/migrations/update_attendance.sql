-- Add check_out_time column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS check_out_time timestamp with time zone;

-- Update RLS policies to allow users to insert and update their own attendance
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
CREATE POLICY "Users can insert their own attendance" 
ON public.attendance FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
CREATE POLICY "Users can update their own attendance" 
ON public.attendance FOR UPDATE 
USING (auth.uid() = user_id);
