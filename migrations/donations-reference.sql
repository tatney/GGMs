-- GGM: donation reference + status tracking (Plan A managed giving)
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS donations_reference_key ON public.donations (reference);

-- Existing rows are treated as completed/on-record gifts.
UPDATE public.donations SET status = 'completed' WHERE status IS NULL AND reference IS NULL;