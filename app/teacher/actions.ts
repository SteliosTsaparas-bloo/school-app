"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearTeacherSession,
  isTeacherAuthenticated,
} from "@/lib/auth/teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subject } from "@/lib/types";

export async function logoutTeacher() {
  await clearTeacherSession();
  redirect("/");
}

import type { StudentWithGrades } from "@/lib/data/students";

export type CreateStudentState = {
  error?: string;
  success?: boolean;
  student?: StudentWithGrades;
};

export async function createStudent(
  _prevState: CreateStudentState | undefined,
  formData: FormData,
): Promise<CreateStudentState> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  const name = formData.get("name");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Το ονοματεπώνυμο είναι υποχρεωτικό." };
  }

  const supabase = createAdminClient();
  const uniqueToken = randomUUID();

  const { data, error } = await supabase
    .from("students")
    .insert({
      name: name.trim(),
      unique_token: uniqueToken,
    })
    .select("id, name, unique_token, created_at")
    .single();

  if (error || !data) {
    return { error: "Αποτυχία αποθήκευσης μαθητή. Δοκιμάστε ξανά." };
  }

  revalidatePath("/teacher");

  return {
    success: true,
    student: {
      id: data.id,
      name: data.name,
      unique_token: data.unique_token,
      created_at: data.created_at,
      grades: [],
    },
  };
}

export async function upsertGrade(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  const studentId = formData.get("studentId");
  const subject = formData.get("subject");
  const gradeValue = formData.get("grade");
  const comments = formData.get("comments");

  if (typeof studentId !== "string" || !studentId) {
    return { error: "Μη έγκυρος μαθητής." };
  }

  if (typeof subject !== "string" || !subject) {
    return { error: "Επιλέξτε μάθημα." };
  }

  const grade =
    typeof gradeValue === "string" && gradeValue.trim() !== ""
      ? Number(gradeValue.replace(",", "."))
      : null;

  if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 10)) {
    return { error: "Ο βαθμός πρέπει να είναι μεταξύ 0 και 10." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("grades").upsert(
    {
      student_id: studentId,
      subject: subject as Subject,
      grade,
      comments:
        typeof comments === "string" && comments.trim() !== ""
          ? comments.trim()
          : null,
    },
    { onConflict: "student_id,subject" },
  );

  if (error) {
    return { error: "Αποτυχία αποθήκευσης. Δοκιμάστε ξανά." };
  }

  revalidatePath("/teacher");

  return { success: true };
}
