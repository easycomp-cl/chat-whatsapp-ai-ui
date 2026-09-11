-- Campos personales del usuario del dashboard (Mi Perfil).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS personal_phone TEXT;

-- El usuario puede actualizar su propio perfil (no role, business_id ni active).
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
