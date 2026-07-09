import type {
  AssessmentGrade,
  GradeRecord,
  SpreadsheetColumn,
  SpreadsheetData,
  StudentDashboard,
  Subject,
  SubjectWithAssessments,
} from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getSubjects() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, sort_order")
    .order("sort_order")
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) satisfies Subject[];
}

export async function getSpreadsheetData(subjectId: string) {
  const supabase = createAdminClient();

  const [{ data: students, error: studentsError }, { data: subjects, error: subjectsError }, { data: grades, error: gradesError }] =
    await Promise.all([
      supabase.from("students").select("id, name, unique_token, created_at").order("name"),
      supabase.from("subjects").select("id, name, sort_order").order("sort_order").order("name"),
      supabase
        .from("grades")
        .select("id, student_id, subject_id, grade, comments, assessment_date, updated_at")
        .eq("subject_id", subjectId)
        .order("assessment_date", { ascending: true }),
    ]);

  if (studentsError || subjectsError || gradesError) {
    throw studentsError ?? subjectsError ?? gradesError;
  }

  const dates = Array.from(
    new Set((grades ?? []).map((grade) => grade.assessment_date as string)),
  ).sort();

  const columns: SpreadsheetColumn[] = dates.map((assessment_date) => {
    const cells: SpreadsheetColumn["cells"] = {};

    for (const student of students ?? []) {
      const record = (grades ?? []).find(
        (grade) =>
          grade.student_id === student.id && grade.assessment_date === assessment_date,
      );

      cells[student.id] = {
        id: record?.id ?? null,
        grade: record?.grade != null ? String(record.grade) : "",
        comments: record?.comments ?? "",
      };
    }

    return { assessment_date, cells };
  });

  return {
    students: students ?? [],
    subjects: subjects ?? [],
    columns,
  } satisfies SpreadsheetData;
}

function parseAssessment(assessment: {
  assessment_date: string;
  grade: number | string | null;
  comments: string | null;
  updated_at: string;
}): AssessmentGrade {
  return {
    assessment_date: assessment.assessment_date,
    grade:
      assessment.grade === null || assessment.grade === undefined
        ? null
        : Number(assessment.grade),
    comments: assessment.comments,
    updated_at: assessment.updated_at,
  };
}

export function buildStudentDashboard(
  student: StudentDashboard["student"],
  subjects: Subject[],
  grades: GradeRecord[],
): StudentDashboard {
  return {
    student,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      sort_order: subject.sort_order,
      assessments: grades
        .filter((grade) => grade.subject_id === subject.id)
        .map((grade) =>
          parseAssessment({
            assessment_date: grade.assessment_date,
            grade: grade.grade,
            comments: grade.comments,
            updated_at: grade.updated_at,
          }),
        )
        .sort(
          (a, b) =>
            new Date(b.assessment_date).getTime() -
            new Date(a.assessment_date).getTime(),
        ),
    })),
  };
}

export function parseStudentDashboardPayload(payload: {
  student: StudentDashboard["student"];
  subjects: Array<{
    id: string;
    name: string;
    sort_order: number;
    assessments: Array<{
      assessment_date: string;
      grade: number | string | null;
      comments: string | null;
      updated_at: string;
    }>;
  }>;
}): StudentDashboard {
  return {
    student: payload.student,
    subjects: (payload.subjects ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      sort_order: subject.sort_order,
      assessments: (subject.assessments ?? []).map(parseAssessment),
    })),
  };
}

export async function getStudentDashboardByToken(token: string) {
  const supabase = createAdminClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, name, unique_token, created_at")
    .eq("unique_token", token)
    .maybeSingle();

  if (studentError || !student) {
    return null;
  }

  const [subjects, { data: grades, error: gradesError }] = await Promise.all([
    getSubjects(),
    supabase
      .from("grades")
      .select("id, student_id, subject_id, grade, comments, assessment_date, updated_at")
      .eq("student_id", student.id)
      .order("assessment_date", { ascending: false }),
  ]);

  if (gradesError) {
    throw gradesError;
  }

  return buildStudentDashboard(
    student,
    subjects,
    (grades ?? []).map((grade) => ({
      id: grade.id,
      student_id: grade.student_id,
      subject_id: grade.subject_id,
      grade: grade.grade == null ? null : Number(grade.grade),
      comments: grade.comments,
      assessment_date: grade.assessment_date,
      updated_at: grade.updated_at,
    })),
  );
}
