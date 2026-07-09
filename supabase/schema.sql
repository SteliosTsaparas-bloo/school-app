-- ============================================================
-- School App — Initial Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Custom types
-- ------------------------------------------------------------

CREATE TYPE public.subject AS ENUM (
  'language',       -- Γλώσσα
  'math',           -- Μαθηματικά
  'history',        -- Ιστορία
  'science',        -- Φυσική
  'geography',      -- Γεωγραφία
  'life_skills',    -- ΚΠΑ
  'religion'        -- Θρησκευτικά
);

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

CREATE TABLE public.students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  unique_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  subject    public.subject NOT NULL,
  grade      NUMERIC(4, 1) CHECK (grade >= 0 AND grade <= 10),
  comments   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

CREATE INDEX idx_students_unique_token ON public.students (unique_token);
CREATE INDEX idx_grades_student_id ON public.grades (student_id);

-- ------------------------------------------------------------
-- Updated-at trigger
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER grades_set_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Helper: read student token from request header
-- Next.js passes: x-student-token: <uuid>
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.request_student_token()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.headers', true)::json->>'x-student-token',
    ''
  )::uuid;
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Parents (anon): read ONLY the student matching their token
CREATE POLICY "parents_read_own_student"
  ON public.students
  FOR SELECT
  TO anon
  USING (unique_token = public.request_student_token());

CREATE POLICY "parents_read_own_grades"
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

-- Teachers (authenticated): full access
CREATE POLICY "teachers_manage_students"
  ON public.students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "teachers_manage_grades"
  ON public.grades
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Optional: secure RPC for server-side token lookup
-- (alternative to header-based RLS)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_dashboard(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'student', json_build_object(
      'id', s.id,
      'name', s.name,
      'unique_token', s.unique_token,
      'created_at', s.created_at
    ),
    'grades', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'subject', g.subject,
            'grade', g.grade,
            'comments', g.comments,
            'updated_at', g.updated_at
          )
          ORDER BY g.subject
        )
        FROM public.grades g
        WHERE g.student_id = s.id
      ),
      '[]'::json
    )
  )
  INTO result
  FROM public.students s
  WHERE s.unique_token = p_token;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_dashboard(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_dashboard(UUID) TO anon, authenticated;

-- ------------------------------------------------------------
-- Sample seed data (optional — remove in production)
-- ------------------------------------------------------------

INSERT INTO public.students (name, unique_token)
VALUES (
  'Μαρία Παπαδοπούλου',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

INSERT INTO public.grades (student_id, subject, grade, comments)
SELECT
  s.id,
  v.subject,
  v.grade,
  v.comments
FROM public.students s
CROSS JOIN (
  VALUES
    ('language'::public.subject, 9.5, 'Εξαιρετική έκθεση. Πολύ καλή ορθογραφία και εκφραστική δεινότητα.'),
    ('math'::public.subject, 8.0, 'Καλή κατανόηση στις πράξεις. Χρειάζεται περισσότερη εξάσκηση στα κλάσματα.'),
    ('history'::public.subject, 9.0, 'Ενεργή συμμετοχή στο μάθημα. Θυμάται καλά τις ημερομηνίες.'),
    ('science'::public.subject, 8.5, 'Ενδιαφέρον για τα πειράματα. Προσεκτική παρατήρηση.'),
    ('geography'::public.subject, 7.5, 'Καλή γνώση της Ελλάδας. Να μελετήσει περισσότερο τους χάρτες.'),
    ('life_skills'::public.subject, 10.0, 'Συνεργατική και ευγενική με τους συμμαθητές της.'),
    ('religion'::public.subject, 9.0, 'Σεβασμός και ενδιαφέρον για τα θρησκευτικά κείμενα.')
) AS v(subject, grade, comments)
WHERE s.unique_token = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
