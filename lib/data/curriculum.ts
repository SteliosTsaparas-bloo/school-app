import type { SubjectWithSubcategories } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

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
