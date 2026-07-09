import type { Student } from "@/lib/types";
import {
  getCurriculum,
  parseStudentDashboardPayload,
  buildSubjectsWithGrades,
} from "@/lib/data/curriculum";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudentRow = Student;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getStudentDashboardViaAdmin(token: string) {
  const supabase = createAdminClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, name, unique_token, created_at")
    .eq("unique_token", token)
    .maybeSingle();

  if (studentError || !student) {
    return null;
  }

  const curriculum = await getCurriculum();
  const { data: entries, error: entriesError } = await supabase
    .from("grade_entries")
    .select("id, subcategory_id, grade, entry_date")
    .eq("student_id", student.id);

  if (entriesError) {
    return { student, subjects: curriculum.map((subject) => ({
      ...subject,
      subcategories: subject.subcategories.map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        sort_order: subcategory.sort_order,
        average: null,
        entries: [],
      })),
    })) };
  }

  const subjects = buildSubjectsWithGrades(
    curriculum,
    (entries ?? []).map((entry) => ({
      id: entry.id,
      subcategory_id: entry.subcategory_id,
      grade: entry.grade,
      entry_date: entry.entry_date,
    })),
  );

  return { student, subjects };
}

async function getStudentDashboardViaRpc(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_student_dashboard", {
    p_token: token,
  });

  if (error || !data || typeof data !== "object" || !("student" in data)) {
    return null;
  }

  return parseStudentDashboardPayload(
    data as Parameters<typeof parseStudentDashboardPayload>[0],
  );
}

export async function getStudentDashboard(token: string) {
  const normalizedToken = token.trim();

  if (!UUID_REGEX.test(normalizedToken)) {
    return null;
  }

  try {
    const dashboard = await getStudentDashboardViaAdmin(normalizedToken);
    if (dashboard) {
      return dashboard;
    }
  } catch {
    // Fall back to RPC when service role key is unavailable.
  }

  return getStudentDashboardViaRpc(normalizedToken);
}

export async function getAllStudents() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("students")
    .select("id, name, unique_token, created_at")
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) satisfies StudentRow[];
}
