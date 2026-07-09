"use server";

import { isTeacherAuthenticated } from "@/lib/auth/teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export type GradeActionResult = {
  error?: string;
  success?: boolean;
};

function parseGradeValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const grade = Number(trimmed.replace(",", "."));
  if (Number.isNaN(grade) || grade < 0 || grade > 10) {
    return undefined;
  }

  return grade;
}

export async function upsertGradeCell(input: {
  studentId: string;
  subcategoryId: string;
  grade: string;
  comments: string;
}): Promise<GradeActionResult> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  const grade = parseGradeValue(input.grade);
  if (grade === undefined) {
    return { error: "Ο βαθμός πρέπει να είναι μεταξύ 0 και 10." };
  }

  const supabase = createAdminClient();

  if (grade === null && !input.comments.trim()) {
    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("student_id", input.studentId)
      .eq("subcategory_id", input.subcategoryId);

    if (error) {
      return { error: "Αποτυχία διαγραφής κελιού." };
    }

    return { success: true };
  }

  if (grade === null) {
    return { error: "Ο βαθμός είναι υποχρεωτικός όταν υπάρχει σχόλιο." };
  }

  const { error } = await supabase.from("grades").upsert(
    {
      student_id: input.studentId,
      subcategory_id: input.subcategoryId,
      grade,
      comments: input.comments.trim() || null,
    },
    { onConflict: "student_id,subcategory_id" },
  );

  if (error) {
    return { error: "Αποτυχία αποθήκευσης κελιού." };
  }

  return { success: true };
}

export async function upsertGradeColumn(input: {
  subcategoryId: string;
  rows: Array<{
    studentId: string;
    grade: string;
    comments: string;
  }>;
}): Promise<GradeActionResult> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  for (const row of input.rows) {
    const result = await upsertGradeCell({
      studentId: row.studentId,
      subcategoryId: input.subcategoryId,
      grade: row.grade,
      comments: row.comments,
    });

    if (result.error) {
      return result;
    }
  }

  return { success: true };
}
