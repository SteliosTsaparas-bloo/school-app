"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StudentRow } from "@/lib/data/students";
import {
  clearTeacherSession,
  isTeacherAuthenticated,
} from "@/lib/auth/teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logoutTeacher() {
  await clearTeacherSession();
  redirect("/");
}

export type CreateStudentState = {
  error?: string;
  success?: boolean;
  student?: StudentRow;
};

export type UpdateStudentState = {
  error?: string;
  success?: boolean;
  student?: StudentRow;
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

  return { success: true, student: data };
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

  return { success: true, student: data };
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
