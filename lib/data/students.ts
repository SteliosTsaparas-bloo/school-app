import type { Grade, Student } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StudentWithGrades = Student & {
  grades: Grade[];
};

export async function getStudentDashboard(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_student_dashboard", {
    p_token: token,
  });

  if (error || !data) {
    return null;
  }

  const payload = data as {
    student: Student;
    grades: Array<{
      subject: Grade["subject"];
      grade: number | string | null;
      comments: string | null;
      updated_at: string;
    }>;
  };

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
