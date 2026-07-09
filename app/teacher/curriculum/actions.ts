"use server";

import { revalidatePath } from "next/cache";
import { isTeacherAuthenticated } from "@/lib/auth/teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = {
  error?: string;
  success?: boolean;
};

async function assertTeacher(): Promise<ActionResult | null> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }
  return null;
}

function revalidateCurriculumPaths() {
  revalidatePath("/teacher/curriculum");
  revalidatePath("/teacher");
  revalidatePath("/student/[token]", "page");
}

export async function createSubject(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const authError = await assertTeacher();
  if (authError) return authError;

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Το όνομα μαθήματος είναι υποχρεωτικό." };
  }

  const supabase = createAdminClient();
  const { data: lastSubject } = await supabase
    .from("subjects")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("subjects").insert({
    name: name.trim(),
    sort_order: (lastSubject?.sort_order ?? 0) + 1,
  });

  if (error) {
    return { error: "Αποτυχία προσθήκης μαθήματος." };
  }

  revalidateCurriculumPaths();
  return { success: true };
}

export async function updateSubject(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const authError = await assertTeacher();
  if (authError) return authError;

  const subjectId = formData.get("subjectId");
  const name = formData.get("name");

  if (typeof subjectId !== "string" || !subjectId) {
    return { error: "Μη έγκυρο μάθημα." };
  }

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Το όνομα μαθήματος είναι υποχρεωτικό." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subjects")
    .update({ name: name.trim() })
    .eq("id", subjectId);

  if (error) {
    return { error: "Αποτυχία ενημέρωσης μαθήματος." };
  }

  revalidateCurriculumPaths();
  return { success: true };
}

export async function deleteSubject(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const authError = await assertTeacher();
  if (authError) return authError;

  const subjectId = formData.get("subjectId");
  if (typeof subjectId !== "string" || !subjectId) {
    return { error: "Μη έγκυρο μάθημα." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);

  if (error) {
    return { error: "Αποτυχία διαγραφής μαθήματος." };
  }

  revalidateCurriculumPaths();
  return { success: true };
}
