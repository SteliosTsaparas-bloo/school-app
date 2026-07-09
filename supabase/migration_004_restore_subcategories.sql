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

-- Re-seed demo subcategories if the table is empty (e.g. after migration 003)
INSERT INTO public.subcategories (id, subject_id, name, sort_order)
SELECT v.id::uuid, v.subject_id::uuid, v.name, v.sort_order
FROM (
  VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Έκθεση', 1),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Ορθογραφία', 2),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Διαγώνισμα', 3),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Πράξεις', 1),
    ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'Κλάσματα', 2),
    ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111102', 'Διαγώνισμα', 3),
    ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111103', 'Ιστορία Ελλάδας', 1),
    ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111103', 'Εργασία τάξης', 2),
    ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111104', 'Πειράματα', 1),
    ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111104', 'Τεστ', 2),
    ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111105', 'Χάρτες', 1),
    ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111105', 'Εργασία', 2),
    ('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111106', 'Συνεργασία', 1),
    ('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111106', 'Εργασίες', 2),
    ('22222222-2222-2222-2222-222222222215', '11111111-1111-1111-1111-111111111107', 'Κείμενα', 1),
    ('22222222-2222-2222-2222-222222222216', '11111111-1111-1111-1111-111111111107', 'Συζήτηση', 2)
) AS v(id, subject_id, name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.subcategories LIMIT 1)
ON CONFLICT (id) DO NOTHING;
