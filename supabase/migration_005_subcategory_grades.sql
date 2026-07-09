-- ============================================================
-- Migration 005: Grades per subcategory (student × subcategory)
-- Run in Supabase SQL Editor AFTER migration_004
-- ============================================================

DROP FUNCTION IF EXISTS public.get_student_dashboard(UUID);

-- Restructure grades: one grade per student per subcategory
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories (id) ON DELETE CASCADE;

ALTER TABLE public.grades
  DROP CONSTRAINT IF EXISTS grades_student_id_subject_id_assessment_date_key;

-- Legacy subject×date rows cannot map to subcategories — remove them
DELETE FROM public.grades
WHERE subcategory_id IS NULL;

ALTER TABLE public.grades
  DROP COLUMN IF EXISTS subject_id;

ALTER TABLE public.grades
  DROP COLUMN IF EXISTS assessment_date;

ALTER TABLE public.grades
  ALTER COLUMN subcategory_id SET NOT NULL;

ALTER TABLE public.grades
  DROP CONSTRAINT IF EXISTS grades_student_subcategory_unique;

ALTER TABLE public.grades
  ADD CONSTRAINT grades_student_subcategory_unique UNIQUE (student_id, subcategory_id);

DROP INDEX IF EXISTS idx_grades_subject_id;
DROP INDEX IF EXISTS idx_grades_assessment_date;

CREATE INDEX IF NOT EXISTS idx_grades_subcategory_id
  ON public.grades (subcategory_id);

-- ------------------------------------------------------------
-- RPC: parent dashboard grouped by subject + subcategory
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
                    g.grade,
                    g.comments,
                    g.updated_at
                  FROM public.subcategories sc
                  LEFT JOIN public.grades g
                    ON g.subcategory_id = sc.id
                   AND g.student_id = v_student_id
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
