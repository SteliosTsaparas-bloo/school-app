-- ============================================================
-- Migration 006: Grades per subcategory × date
-- Run in Supabase SQL Editor AFTER migration_005
-- ============================================================

DROP FUNCTION IF EXISTS public.get_student_dashboard(UUID);

ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS assessment_date DATE;

UPDATE public.grades
SET assessment_date = CURRENT_DATE
WHERE assessment_date IS NULL;

ALTER TABLE public.grades
  ALTER COLUMN assessment_date SET NOT NULL;

ALTER TABLE public.grades
  DROP CONSTRAINT IF EXISTS grades_student_subcategory_unique;

ALTER TABLE public.grades
  DROP CONSTRAINT IF EXISTS grades_student_subcategory_date_unique;

ALTER TABLE public.grades
  ADD CONSTRAINT grades_student_subcategory_date_unique
  UNIQUE (student_id, subcategory_id, assessment_date);

CREATE INDEX IF NOT EXISTS idx_grades_assessment_date
  ON public.grades (assessment_date);

-- ------------------------------------------------------------
-- RPC: parent dashboard — subjects → subcategories → dated entries
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
                        SELECT ROUND(AVG(g.grade)::numeric, 1)
                        FROM public.grades g
                        WHERE g.subcategory_id = sc.id
                          AND g.student_id = v_student_id
                      ),
                      NULL
                    ) AS average,
                    COALESCE(
                      (
                        SELECT json_agg(
                          json_build_object(
                            'id', g.id,
                            'assessment_date', g.assessment_date,
                            'grade', g.grade,
                            'comments', g.comments,
                            'updated_at', g.updated_at
                          )
                          ORDER BY g.assessment_date DESC
                        )
                        FROM public.grades g
                        WHERE g.subcategory_id = sc.id
                          AND g.student_id = v_student_id
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
