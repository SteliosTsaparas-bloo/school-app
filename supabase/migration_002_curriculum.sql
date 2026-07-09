-- ============================================================
-- Migration 002: Curriculum (subjects, subcategories, daily grades)
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Remove legacy grade structure
DROP FUNCTION IF EXISTS public.get_student_dashboard(UUID);
DROP TABLE IF EXISTS public.grades;
DROP TYPE IF EXISTS public.subject;

-- ------------------------------------------------------------
-- Curriculum tables
-- ------------------------------------------------------------

CREATE TABLE public.subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subcategories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grade_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  subcategory_id  UUID NOT NULL REFERENCES public.subcategories (id) ON DELETE CASCADE,
  grade           NUMERIC(4, 1) NOT NULL CHECK (grade >= 0 AND grade <= 10),
  entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subcategory_id, entry_date)
);

CREATE INDEX idx_subcategories_subject_id ON public.subcategories (subject_id);
CREATE INDEX idx_grade_entries_student_id ON public.grade_entries (student_id);
CREATE INDEX idx_grade_entries_subcategory_id ON public.grade_entries (subcategory_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_subjects"
  ON public.subjects FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_subcategories"
  ON public.subcategories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "parents_read_grade_entries"
  ON public.grade_entries FOR SELECT TO anon
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE unique_token = public.request_student_token()
    )
  );

CREATE POLICY "teachers_manage_subjects"
  ON public.subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "teachers_manage_subcategories"
  ON public.subcategories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "teachers_manage_grade_entries"
  ON public.grade_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- RPC: student dashboard (parent view)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_dashboard(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  result JSON;
BEGIN
  SELECT id INTO v_student_id
  FROM public.students
  WHERE unique_token = p_token;

  IF v_student_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'student', (
      SELECT json_build_object(
        'id', s.id,
        'name', s.name,
        'unique_token', s.unique_token,
        'created_at', s.created_at
      )
      FROM public.students s
      WHERE s.id = v_student_id
    ),
    'subjects', COALESCE(
      (
        SELECT json_agg(subject_row ORDER BY subject_row.sort_order, subject_row.name)
        FROM (
          SELECT
            sub.id,
            sub.name,
            sub.sort_order,
            COALESCE(
              (
                SELECT json_agg(subcat_row ORDER BY subcat_row.sort_order, subcat_row.name)
                FROM (
                  SELECT
                    sc.id,
                    sc.name,
                    sc.sort_order,
                    COALESCE(
                      (
                        SELECT ROUND(AVG(ge.grade)::numeric, 1)
                        FROM public.grade_entries ge
                        WHERE ge.subcategory_id = sc.id
                          AND ge.student_id = v_student_id
                      ),
                      NULL
                    ) AS average,
                    COALESCE(
                      (
                        SELECT json_agg(
                          json_build_object(
                            'id', ge.id,
                            'grade', ge.grade,
                            'entry_date', ge.entry_date
                          )
                          ORDER BY ge.entry_date DESC
                        )
                        FROM public.grade_entries ge
                        WHERE ge.subcategory_id = sc.id
                          AND ge.student_id = v_student_id
                      ),
                      '[]'::json
                    ) AS entries
                  FROM public.subcategories sc
                  WHERE sc.subject_id = sub.id
                ) AS subcat_row
              ),
              '[]'::json
            ) AS subcategories
          FROM public.subjects sub
        ) AS subject_row
      ),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_dashboard(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_dashboard(UUID) TO anon, authenticated;

-- ------------------------------------------------------------
-- Demo curriculum
-- ------------------------------------------------------------

INSERT INTO public.subjects (id, name, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Γλώσσα', 1),
  ('11111111-1111-1111-1111-111111111102', 'Μαθηματικά', 2),
  ('11111111-1111-1111-1111-111111111103', 'Ιστορία', 3),
  ('11111111-1111-1111-1111-111111111104', 'Φυσική', 4),
  ('11111111-1111-1111-1111-111111111105', 'Γεωγραφία', 5),
  ('11111111-1111-1111-1111-111111111106', 'ΚΠΑ', 6),
  ('11111111-1111-1111-1111-111111111107', 'Θρησκευτικά', 7);

INSERT INTO public.subcategories (id, subject_id, name, sort_order) VALUES
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
  ('22222222-2222-2222-2222-222222222216', '11111111-1111-1111-1111-111111111107', 'Συζήτηση', 2);

-- Demo daily grades for Maria (if she exists)
INSERT INTO public.grade_entries (student_id, subcategory_id, grade, entry_date)
SELECT s.id, v.subcategory_id::uuid, v.grade::numeric, v.entry_date::date
FROM public.students s
CROSS JOIN (
  VALUES
    ('22222222-2222-2222-2222-222222222201'::uuid, 9.5, '2026-07-01'),
    ('22222222-2222-2222-2222-222222222201'::uuid, 10.0, '2026-07-03'),
    ('22222222-2222-2222-2222-222222222202'::uuid, 8.0, '2026-07-02'),
    ('22222222-2222-2222-2222-222222222202'::uuid, 9.0, '2026-07-04'),
    ('22222222-2222-2222-2222-222222222204'::uuid, 7.5, '2026-07-01'),
    ('22222222-2222-2222-2222-222222222204'::uuid, 8.5, '2026-07-05'),
    ('22222222-2222-2222-2222-222222222205'::uuid, 8.0, '2026-07-03'),
    ('22222222-2222-2222-2222-222222222207'::uuid, 9.0, '2026-07-02'),
    ('22222222-2222-2222-2222-222222222209'::uuid, 8.5, '2026-07-04'),
    ('22222222-2222-2222-2222-222222222213'::uuid, 10.0, '2026-07-01'),
    ('22222222-2222-2222-2222-222222222215'::uuid, 9.5, '2026-07-03')
) AS v(subcategory_id, grade, entry_date)
WHERE s.unique_token = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ON CONFLICT (student_id, subcategory_id, entry_date) DO NOTHING;
