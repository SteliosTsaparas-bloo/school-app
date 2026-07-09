import type { Grade, Student } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudentWithGrades = Student & {
  grades: Grade[];
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseDashboard(payload: {
  student: Student;
  grades: Array<{
    subject: Grade["subject"];
    grade: number | string | null;
    comments: string | null;
    updated_at: string;
  }>;
}) {
  return {
    student: payload.student,
    grades: (payload.grades ?? []).map((entry) => ({
      subject: entry.subject,
      grade:
        entry.grade === null || entry.grade === undefined
          ? null
          : Number(entry.grade),
      comments: entry.comments,
      updated_at: entry.updated_at,
    })),
  };
}

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

  const { data: grades, error: gradesError } = await supabase
    .from("grades")
    .select("subject, grade, comments, updated_at")
    .eq("student_id", student.id)
    .order("subject");

  if (gradesError) {
    return { student, grades: [] };
  }

  return parseDashboard({
    student,
    grades: (grades ?? []).map((entry) => ({
      subject: entry.subject as Grade["subject"],
      grade: entry.grade,
      comments: entry.comments,
      updated_at: entry.updated_at,
    })),
  });
}

async function getStudentDashboardViaRpc(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_student_dashboard", {
    p_token: token,
  });

  if (error || !data || typeof data !== "object" || !("student" in data)) {
    return null;
  }

  return parseDashboard(
    data as {
      student: Student;
      grades: Array<{
        subject: Grade["subject"];
        grade: number | string | null;
        comments: string | null;
        updated_at: string;
      }>;
    },
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
    // Fall back to RPC when service role key is unavailable (e.g. local dev).
  }

  return getStudentDashboardViaRpc(normalizedToken);
}

export async function getAllStudents() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("students")
    .select(
      "id, name, unique_token, created_at, grades(subject, grade, comments, updated_at)",
    )
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    unique_token: student.unique_token,
    created_at: student.created_at,
    grades: (student.grades ?? []).map((entry) => ({
      subject: entry.subject as Grade["subject"],
      grade:
        entry.grade === null || entry.grade === undefined
          ? null
          : Number(entry.grade),
      comments: entry.comments,
      updated_at: entry.updated_at,
    })),
  })) satisfies StudentWithGrades[];
}
