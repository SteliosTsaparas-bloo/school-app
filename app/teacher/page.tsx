import Link from "next/link";
import { StudentsTable } from "@/components/teacher/StudentsTable";
import { getAllStudents } from "@/lib/data/students";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  let students: Awaited<ReturnType<typeof getAllStudents>> = [];
  let configError: string | null = null;

  try {
    students = await getAllStudents();
  } catch {
    configError =
      "Δεν ήταν δυνατή η σύνδεση με τη βάση. Βεβαιωθείτε ότι το SUPABASE_SERVICE_ROLE_KEY έχει οριστεί στο .env.local.";
    students = [];
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-16 border-b border-zinc-200 pb-10">
        <p className="mb-3 text-sm tracking-[0.2em] text-zinc-500 uppercase">
          Διαχείριση
        </p>
        <h1 className="text-3xl font-light tracking-tight text-zinc-900">
          Μαθητές
        </h1>
        <p className="mt-4 max-w-xl text-base font-light text-zinc-600">
          Διαχειριστείτε τη βαθμολογία και μοιραστείτε τον προσωπικό σύνδεσμο
          κάθε μαθητή με τους γονείς.
        </p>
      </header>

      <div className="mb-10 flex flex-col gap-3 border border-zinc-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">Μαθήματα & Υποκατηγορίες</p>
          <p className="mt-1 text-sm font-light text-zinc-500">
            Προσθήκη, επεξεργασία και διαγραφή μαθημάτων και υποκατηγοριών.
          </p>
        </div>
        <Link
          href="/teacher/curriculum"
          className="border border-zinc-900 px-5 py-2.5 text-center text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          Διαχείριση Μαθημάτων
        </Link>
      </div>

      {configError && (
        <div className="mb-8 border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {configError}
        </div>
      )}

      <StudentsTable students={students} />
    </div>
  );
}
