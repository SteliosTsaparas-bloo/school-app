-- ============================================================
-- Migration 004: Restore subcategories (curriculum structure)
-- Run in Supabase SQL Editor AFTER migration_003
-- Keeps spreadsheet `grades` table; subcategories are for
-- organizing subjects in /teacher/curriculum only.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subcategories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_subject_id
  ON public.subcategories (subject_id);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "teachers_manage_subcategories" ON public.subcategories;

CREATE POLICY "public_read_subcategories"
  ON public.subcategories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "teachers_manage_subcategories"
  ON public.subcategories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTE: No demo seed here on purpose.
-- Migration 003 dropped subcategories; re-inserting demo rows would
-- overwrite teacher customizations (e.g. replacing "Έκθεση" with
-- "χωρίς εργασία"). Manage subcategories via /teacher/curriculum.
