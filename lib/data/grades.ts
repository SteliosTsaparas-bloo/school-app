import type {
  GradeEntry,
  GradeRecord,
  SpreadsheetData,
  StudentDashboard,
  Subject,
  SubjectWithGrades,
  SubcategoryWithGrades,
} from "@/lib/types";
import { computeAverage } from "@/lib/utils/grades";
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

  const [
    { data: students, error: studentsError },
    { data: subjects, error: subjectsError },
    { data: subcategories, error: subcategoriesError },
  ] = await Promise.all([
    supabase.from("students").select("id, name, unique_token, created_at").order("name"),
    supabase.from("subjects").select("id, name, sort_order").order("sort_order").order("name"),
    supabase
      .from("subcategories")
      .select("id, subject_id, name, sort_order")
      .eq("subject_id", subjectId)
      .order("sort_order")
      .order("name"),
  ]);

  if (studentsError || subjectsError || subcategoriesError) {
    throw studentsError ?? subjectsError ?? subcategoriesError;
  }

  const subcategoryIds = (subcategories ?? []).map((subcategory) => subcategory.id);
  let gradeRows: GradeRecord[] = [];

  if (subcategoryIds.length > 0) {
    const { data: grades, error: gradesError } = await supabase
      .from("grades")
      .select(
        "id, student_id, subcategory_id, assessment_date, grade, comments, updated_at",
      )
      .in("subcategory_id", subcategoryIds)
      .order("assessment_date", { ascending: true });

    if (gradesError) {
      throw gradesError;
    }

    gradeRows = (grades ?? []).map((grade) => ({
      id: grade.id,
      student_id: grade.student_id,
      subcategory_id: grade.subcategory_id,
      assessment_date: grade.assessment_date,
      grade: grade.grade == null ? null : Number(grade.grade),
      comments: grade.comments,
      updated_at: grade.updated_at,
    }));
  }

  const subcategorySpreadsheets = (subcategories ?? []).map((subcategory) => {
    const subcategoryGrades = gradeRows.filter(
      (grade) => grade.subcategory_id === subcategory.id,
    );

    const dates = Array.from(
      new Set(subcategoryGrades.map((grade) => grade.assessment_date)),
    ).sort();

    const columns = dates.map((assessment_date) => {
      const cells: Record<string, { id: string | null; grade: string; comments: string }> =
        {};

      for (const student of students ?? []) {
        const record = subcategoryGrades.find(
          (grade) =>
            grade.student_id === student.id &&
            grade.assessment_date === assessment_date,
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
      subcategory_id: subcategory.id,
      subcategory_name: subcategory.name,
      sort_order: subcategory.sort_order,
      columns,
    };
  });

  return {
    students: students ?? [],
    subjects: subjects ?? [],
    subcategories: subcategorySpreadsheets,
  } satisfies SpreadsheetData;
}

function parseGradeEntry(entry: {
  id: string;
  assessment_date: string;
  grade: number | string | null;
  comments: string | null;
  updated_at: string;
}): GradeEntry {
  return {
    id: entry.id,
    assessment_date: entry.assessment_date,
    grade:
      entry.grade === null || entry.grade === undefined
        ? null
        : Number(entry.grade),
    comments: entry.comments,
    updated_at: entry.updated_at,
  };
}

function parseSubcategoryWithGrades(subcategory: {
  id: string;
  name: string;
  sort_order: number;
  average?: number | string | null;
  entries: Array<{
    id: string;
    assessment_date: string;
    grade: number | string | null;
    comments: string | null;
    updated_at: string;
  }>;
}): SubcategoryWithGrades {
  const entries = (subcategory.entries ?? []).map(parseGradeEntry);
  const numericGrades = entries
    .map((entry) => entry.grade)
    .filter((grade): grade is number => grade !== null);

  return {
    id: subcategory.id,
    name: subcategory.name,
    sort_order: subcategory.sort_order,
    average:
      subcategory.average === null || subcategory.average === undefined
        ? computeAverage(numericGrades)
        : Number(subcategory.average),
    entries,
  };
}

export function buildStudentDashboard(
  student: StudentDashboard["student"],
  subjects: Subject[],
  subcategories: Array<{
    id: string;
    subject_id: string;
    name: string;
    sort_order: number;
  }>,
  grades: GradeRecord[],
): StudentDashboard {
  return {
    student,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      sort_order: subject.sort_order,
      subcategories: subcategories
        .filter((subcategory) => subcategory.subject_id === subject.id)
        .map((subcategory) => {
          const entries = grades
            .filter((grade) => grade.subcategory_id === subcategory.id)
            .map((grade) =>
              parseGradeEntry({
                id: grade.id,
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
            );

          return {
            id: subcategory.id,
            name: subcategory.name,
            sort_order: subcategory.sort_order,
            average: computeAverage(
              entries
                .map((entry) => entry.grade)
                .filter((grade): grade is number => grade !== null),
            ),
            entries,
          };
        })
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order || a.name.localeCompare(b.name, "el"),
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
    subcategories: Array<{
      id: string;
      name: string;
      sort_order: number;
      average?: number | string | null;
      entries: Array<{
        id: string;
        assessment_date: string;
        grade: number | string | null;
        comments: string | null;
        updated_at: string;
      }>;
    }>;
  }>;
}): StudentDashboard {
  return {
    student: payload.student,
    subjects: (payload.subjects ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      sort_order: subject.sort_order,
      subcategories: (subject.subcategories ?? [])
        .map(parseSubcategoryWithGrades)
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order || a.name.localeCompare(b.name, "el"),
        ),
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

  const [subjects, { data: subcategories, error: subcategoriesError }, { data: grades, error: gradesError }] =
    await Promise.all([
      getSubjects(),
      supabase
        .from("subcategories")
        .select("id, subject_id, name, sort_order")
        .order("sort_order")
        .order("name"),
      supabase
        .from("grades")
        .select(
          "id, student_id, subcategory_id, assessment_date, grade, comments, updated_at",
        )
        .eq("student_id", student.id)
        .order("assessment_date", { ascending: false }),
    ]);

  if (subcategoriesError || gradesError) {
    throw subcategoriesError ?? gradesError;
  }

  return buildStudentDashboard(
    student,
    subjects,
    subcategories ?? [],
    (grades ?? []).map((grade) => ({
      id: grade.id,
      student_id: grade.student_id,
      subcategory_id: grade.subcategory_id,
      assessment_date: grade.assessment_date,
      grade: grade.grade == null ? null : Number(grade.grade),
      comments: grade.comments,
      updated_at: grade.updated_at,
    })),
  );
}
