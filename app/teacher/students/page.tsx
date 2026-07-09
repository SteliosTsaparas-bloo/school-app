import { StudentsTable } from "@/components/teacher/StudentsTable";
import { getAllStudents } from "@/lib/data/students";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  let students: Awaited<ReturnType<typeof getAllStudents>> = [];
  let configError: string | null = null;

  try {
    students = await getAllStudents();
  } catch {
    configError = "Δεν ήταν δυνατή η φόρτωση των μαθητών.";
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
        <p className="mt-4 max-w-2xl text-base font-light text-zinc-600">
          Προσθέστε, επεξεργαστείτε ή διαγράψτε μαθητές. Δείτε QR codes και
          προσωπικούς συνδέσμους για τους γονείς.
        </p>
      </header>

      {configError && (
        <div className="mb-8 border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {configError}
        </div>
      )}

      <StudentsTable students={students} />
    </div>
  );
}
