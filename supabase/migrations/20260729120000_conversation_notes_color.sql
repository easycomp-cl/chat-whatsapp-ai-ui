-- Pastel color for internal notes (mint, peach, lemon, lavender, sky, rose)

ALTER TABLE public.conversation_notes
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'lemon';

ALTER TABLE public.conversation_notes
  DROP CONSTRAINT IF EXISTS conversation_notes_color_check;

ALTER TABLE public.conversation_notes
  ADD CONSTRAINT conversation_notes_color_check
  CHECK (color IN ('mint', 'peach', 'lemon', 'lavender', 'sky', 'rose'));

CREATE POLICY notes_update ON public.conversation_notes
  FOR UPDATE
  USING (public.can_access_tenant(business_id))
  WITH CHECK (public.can_access_tenant(business_id));
