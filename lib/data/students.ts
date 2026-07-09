import { getStudentDashboardByToken, parseStudentDashboardPayload } from "@/lib/data/grades";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudentRow = {
  id: string;
  name: string;
  unique_token: string;
  created_at: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const dashboard = await getStudentDashboardByToken(normalizedToken);
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
