import type {
  GradeEntry,
  SubjectWithGrades,
  SubjectWithSubcategories,
  SubcategoryWithGrades,
} from "@/lib/types";
import { computeAverage } from "@/lib/utils/grades";
import { createAdminClient } from "@/lib/supabase/admin";

type RawGradeEntry = {
  id: string;
  subcategory_id: string;
  grade: number | string;
  entry_date: string;
};

export async function getCurriculum() {
  const supabase = createAdminClient();

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, name, sort_order, subcategories(id, subject_id, name, sort_order)")
    .order("sort_order")
    .order("name");

  if (subjectsError) {
    throw subjectsError;
  }

  return (subjects ?? []).map((subject) => ({
    id: subject.id,
    name: subject.name,
    sort_order: subject.sort_order,
    subcategories: (subject.subcategories ?? [])
      .map((subcategory) => ({
        id: subcategory.id,
        subject_id: subcategory.subject_id,
        name: subcategory.name,
        sort_order: subcategory.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "el")),
  })) satisfies SubjectWithSubcategories[];
}

export function buildSubjectsWithGrades(
  curriculum: SubjectWithSubcategories[],
  entries: RawGradeEntry[],
): SubjectWithGrades[] {
  const entriesBySubcategory = new Map<string, RawGradeEntry[]>();

  for (const entry of entries) {
    const list = entriesBySubcategory.get(entry.subcategory_id) ?? [];
    list.push(entry);
    entriesBySubcategory.set(entry.subcategory_id, list);
  }

  return curriculum.map((subject) => ({
    id: subject.id,
    name: subject.name,
    sort_order: subject.sort_order,
    subcategories: subject.subcategories.map((subcategory) => {
      const subcategoryEntries = (entriesBySubcategory.get(subcategory.id) ?? [])
        .map(
          (entry): GradeEntry => ({
            id: entry.id,
            grade: Number(entry.grade),
            entry_date: entry.entry_date,
          }),
        )
        .sort(
          (a, b) =>
            new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
        );

      return {
        id: subcategory.id,
        name: subcategory.name,
        sort_order: subcategory.sort_order,
        average: computeAverage(subcategoryEntries.map((entry) => entry.grade)),
        entries: subcategoryEntries,
      } satisfies SubcategoryWithGrades;
    }),
  }));
}

export async function getStudentGradeData(studentId: string) {
  const curriculum = await getCurriculum();
  const supabase = createAdminClient();

  const { data: entries, error } = await supabase
    .from("grade_entries")
    .select("id, subcategory_id, grade, entry_date")
    .eq("student_id", studentId)
    .order("entry_date", { ascending: false });

  if (error) {
    throw error;
  }

  return buildSubjectsWithGrades(curriculum, entries ?? []);
}

export function parseStudentDashboardPayload(payload: {
  student: {
    id: string;
    name: string;
    unique_token: string;
    created_at: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    sort_order: number;
    subcategories: Array<{
      id: string;
      name: string;
      sort_order: number;
      average: number | string | null;
      entries: Array<{
        id: string;
        grade: number | string;
        entry_date: string;
      }>;
    }>;
  }>;
}) {
  return {
    student: payload.student,
    subjects: (payload.subjects ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      sort_order: subject.sort_order,
      subcategories: (subject.subcategories ?? []).map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        sort_order: subcategory.sort_order,
        average:
          subcategory.average === null || subcategory.average === undefined
            ? null
            : Number(subcategory.average),
        entries: (subcategory.entries ?? []).map((entry) => ({
          id: entry.id,
          grade: Number(entry.grade),
          entry_date: entry.entry_date,
        })),
      })),
    })),
  };
}
