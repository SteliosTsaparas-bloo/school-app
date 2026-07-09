"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StudentWithGrades } from "@/lib/data/students";
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

export type CreateStudentState = {
  error?: string;
  success?: boolean;
  student?: StudentWithGrades;
};

export type UpdateStudentState = {
  error?: string;
  success?: boolean;
  student?: StudentWithGrades;
};

export type DeleteStudentState = {
  error?: string;
  success?: boolean;
  studentId?: string;
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

export async function updateStudent(
  _prevState: UpdateStudentState | undefined,
  formData: FormData,
): Promise<UpdateStudentState> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  const studentId = formData.get("studentId");
  const name = formData.get("name");

  if (typeof studentId !== "string" || !studentId) {
    return { error: "Μη έγκυρος μαθητής." };
  }

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Το ονοματεπώνυμο είναι υποχρεωτικό." };
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("students")
    .select("id, unique_token, created_at, grades(subject, grade, comments, updated_at)")
    .eq("id", studentId)
    .single();

  if (fetchError || !existing) {
    return { error: "Ο μαθητής δεν βρέθηκε." };
  }

  const { data, error } = await supabase
    .from("students")
    .update({ name: name.trim() })
    .eq("id", studentId)
    .select("id, name, unique_token, created_at")
    .single();

  if (error || !data) {
    return { error: "Αποτυχία ενημέρωσης. Δοκιμάστε ξανά." };
  }

  revalidatePath("/teacher");

  return {
    success: true,
    student: {
      id: data.id,
      name: data.name,
      unique_token: data.unique_token,
      created_at: data.created_at,
      grades: (existing.grades ?? []).map((entry) => ({
        subject: entry.subject as Subject,
        grade:
          entry.grade === null || entry.grade === undefined
            ? null
            : Number(entry.grade),
        comments: entry.comments,
        updated_at: entry.updated_at,
      })),
    },
  };
}

export async function deleteStudent(
  _prevState: DeleteStudentState | undefined,
  formData: FormData,
): Promise<DeleteStudentState> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  const studentId = formData.get("studentId");

  if (typeof studentId !== "string" || !studentId) {
    return { error: "Μη έγκυρος μαθητής." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);

  if (error) {
    return { error: "Αποτυχία διαγραφής. Δοκιμάστε ξανά." };
  }

  revalidatePath("/teacher");

  return { success: true, studentId };
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
