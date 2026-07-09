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
  assessmentDate: string;
  grade: string;
  comments: string;
}): Promise<GradeActionResult> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  if (!input.assessmentDate.trim()) {
    return { error: "Η ημερομηνία είναι υποχρεωτική." };
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
      .eq("subcategory_id", input.subcategoryId)
      .eq("assessment_date", input.assessmentDate);

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
      assessment_date: input.assessmentDate,
      grade,
      comments: input.comments.trim() || null,
    },
    { onConflict: "student_id,subcategory_id,assessment_date" },
  );

  if (error) {
    return { error: "Αποτυχία αποθήκευσης κελιού." };
  }

  return { success: true };
}

export async function upsertGradeColumn(input: {
  subcategoryId: string;
  assessmentDate: string;
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
      assessmentDate: input.assessmentDate,
      grade: row.grade,
      comments: row.comments,
    });

    if (result.error) {
      return result;
    }
  }

  return { success: true };
}

export async function updateColumnDate(input: {
  subcategoryId: string;
  oldDate: string;
  newDate: string;
}): Promise<GradeActionResult> {
  if (!(await isTeacherAuthenticated())) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση." };
  }

  if (!input.newDate.trim()) {
    return { error: "Η ημερομηνία είναι υποχρεωτική." };
  }

  if (input.oldDate === input.newDate) {
    return { success: true };
  }

  const supabase = createAdminClient();

  const { data: conflict } = await supabase
    .from("grades")
    .select("id")
    .eq("subcategory_id", input.subcategoryId)
    .eq("assessment_date", input.newDate)
    .limit(1)
    .maybeSingle();

  if (conflict) {
    return { error: "Υπάρχει ήδη στήλη με αυτή την ημερομηνία." };
  }

  const { error } = await supabase
    .from("grades")
    .update({ assessment_date: input.newDate })
    .eq("subcategory_id", input.subcategoryId)
    .eq("assessment_date", input.oldDate);

  if (error) {
    return { error: "Αποτυχία ενημέρωσης ημερομηνίας στήλης." };
  }

  return { success: true };
}
