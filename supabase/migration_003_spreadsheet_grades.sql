-- ============================================================
-- Migration 003: Spreadsheet-style grades (subject × date)
-- Run in Supabase SQL Editor AFTER migration_002
-- ============================================================

DROP FUNCTION IF EXISTS public.get_student_dashboard(UUID);

-- Migrate existing daily entries into subject-level grades (best effort)
CREATE TABLE IF NOT EXISTS public.grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  subject_id      UUID NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
  grade           NUMERIC(4, 1) CHECK (grade >= 0 AND grade <= 10),
  comments        TEXT,
  assessment_date DATE NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, assessment_date)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'grade_entries'
  ) THEN
    INSERT INTO public.grades (student_id, subject_id, grade, assessment_date, comments)
    SELECT
      ge.student_id,
      sc.subject_id,
      ge.grade,
      ge.entry_date,
      NULL
    FROM public.grade_entries ge
    INNER JOIN public.subcategories sc ON sc.id = ge.subcategory_id
    ON CONFLICT (student_id, subject_id, assessment_date) DO NOTHING;

    DROP TABLE public.grade_entries;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subcategories'
  ) THEN
    DROP TABLE public.subcategories;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades (subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_date ON public.grades (assessment_date);

DROP TRIGGER IF EXISTS grades_set_updated_at ON public.grades;
CREATE TRIGGER grades_set_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parents_read_grades" ON public.grades;
DROP POLICY IF EXISTS "teachers_manage_grades" ON public.grades;

CREATE POLICY "parents_read_grades"
  ON public.grades
  FOR SELECT
  TO anon
  USING (
    student_id IN (
      SELECT id
      FROM public.students
      WHERE unique_token = public.request_student_token()
    )
  );

CREATE POLICY "teachers_manage_grades"
  ON public.grades
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- RPC: parent dashboard grouped by subject + assessment date
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
                SELECT json_agg(assessment_row ORDER BY assessment_row.assessment_date DESC)
                FROM (
                  SELECT
                    g.assessment_date,
                    g.grade,
                    g.comments,
                    g.updated_at
                  FROM public.grades g
                  WHERE g.student_id = v_student_id
                    AND g.subject_id = sub.id
                ) AS assessment_row
              ),
              '[]'::json
            ) AS assessments
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

-- Demo spreadsheet grades for Maria (if she exists)
INSERT INTO public.grades (student_id, subject_id, grade, comments, assessment_date)
SELECT s.id, v.subject_id::uuid, v.grade::numeric, v.comments, v.assessment_date::date
FROM public.students s
CROSS JOIN (
  VALUES
    ('11111111-1111-1111-1111-111111111101', 9.5, 'Πολύ καλή έκθεση', '2026-07-01'),
    ('11111111-1111-1111-1111-111111111101', 10.0, NULL, '2026-07-08'),
    ('11111111-1111-1111-1111-111111111102', 8.0, 'Καλή κατανόηση', '2026-07-02'),
    ('11111111-1111-1111-1111-111111111102', 8.5, NULL, '2026-07-09'),
    ('11111111-1111-1111-1111-111111111103', 9.0, NULL, '2026-07-03')
) AS v(subject_id, grade, comments, assessment_date)
WHERE s.unique_token = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ON CONFLICT (student_id, subject_id, assessment_date) DO NOTHING;
