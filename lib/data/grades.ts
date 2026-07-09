import type {
  GradeRecord,
  SpreadsheetColumn,
  SpreadsheetData,
  StudentDashboard,
  Subject,
  SubjectWithGrades,
  SubcategoryGrade,
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
  let gradeRows: Array<{
    id: string;
    student_id: string;
    subcategory_id: string;
    grade: number | string | null;
    comments: string | null;
    updated_at: string;
  }> = [];

  if (subcategoryIds.length > 0) {
    const { data: grades, error: gradesError } = await supabase
      .from("grades")
      .select("id, student_id, subcategory_id, grade, comments, updated_at")
      .in("subcategory_id", subcategoryIds);

    if (gradesError) {
      throw gradesError;
    }

    gradeRows = grades ?? [];
  }

  const columns: SpreadsheetColumn[] = (subcategories ?? []).map((subcategory) => {
    const cells: SpreadsheetColumn["cells"] = {};

    for (const student of students ?? []) {
      const record = gradeRows.find(
        (grade) =>
          grade.student_id === student.id &&
          grade.subcategory_id === subcategory.id,
      );

      cells[student.id] = {
        id: record?.id ?? null,
        grade: record?.grade != null ? String(record.grade) : "",
        comments: record?.comments ?? "",
      };
    }

    return {
      subcategory_id: subcategory.id,
      subcategory_name: subcategory.name,
      sort_order: subcategory.sort_order,
      cells,
    };
  });

  return {
    students: students ?? [],
    subjects: subjects ?? [],
    columns,
  } satisfies SpreadsheetData;
}

function parseSubcategoryGrade(subcategory: {
  id: string;
  name: string;
  sort_order: number;
  grade: number | string | null;
  comments: string | null;
  updated_at: string | null;
}): SubcategoryGrade {
  return {
    id: subcategory.id,
    name: subcategory.name,
    sort_order: subcategory.sort_order,
    grade:
      subcategory.grade === null || subcategory.grade === undefined
        ? null
        : Number(subcategory.grade),
    comments: subcategory.comments,
    updated_at: subcategory.updated_at,
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
          const record = grades.find(
            (grade) => grade.subcategory_id === subcategory.id,
          );

          return parseSubcategoryGrade({
            id: subcategory.id,
            name: subcategory.name,
            sort_order: subcategory.sort_order,
            grade: record?.grade ?? null,
            comments: record?.comments ?? null,
            updated_at: record?.updated_at ?? null,
          });
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
      grade: number | string | null;
      comments: string | null;
      updated_at: string | null;
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
        .map(parseSubcategoryGrade)
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
        .select("id, student_id, subcategory_id, grade, comments, updated_at")
        .eq("student_id", student.id),
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
      grade: grade.grade == null ? null : Number(grade.grade),
      comments: grade.comments,
      updated_at: grade.updated_at,
    })),
  );
}
