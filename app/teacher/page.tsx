import Link from "next/link";
import { GradeSpreadsheet } from "@/components/teacher/GradeSpreadsheet";
import { StudentsTable } from "@/components/teacher/StudentsTable";
import { getSpreadsheetData, getSubjects } from "@/lib/data/grades";
import { getAllStudents } from "@/lib/data/students";

export const dynamic = "force-dynamic";

type TeacherPageProps = {
  searchParams: Promise<{ subject?: string }>;
};

export default async function TeacherDashboardPage({ searchParams }: TeacherPageProps) {
  const { subject: subjectParam } = await searchParams;

  let students: Awaited<ReturnType<typeof getAllStudents>> = [];
  let subjects: Awaited<ReturnType<typeof getSubjects>> = [];
  let spreadsheet = { columns: [] as Awaited<ReturnType<typeof getSpreadsheetData>>["columns"] };
  let configError: string | null = null;

  try {
    [students, subjects] = await Promise.all([getAllStudents(), getSubjects()]);
    const activeSubjectId = subjects.find((subject) => subject.id === subjectParam)?.id
      ?? subjects[0]?.id;

    if (activeSubjectId) {
      spreadsheet = await getSpreadsheetData(activeSubjectId);
    }
  } catch {
    configError =
      "Δεν ήταν δυνατή η σύνδεση με τη βάση. Βεβαιωθείτε ότι έχετε τρέξει το migration_003_spreadsheet_grades.sql.";
    students = [];
    subjects = [];
  }

  const activeSubjectId = subjects.find((subject) => subject.id === subjectParam)?.id
    ?? subjects[0]?.id
    ?? "";

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-16 border-b border-zinc-200 pb-10">
        <p className="mb-3 text-sm tracking-[0.2em] text-zinc-500 uppercase">
          Διαχείριση
        </p>
        <h1 className="text-3xl font-light tracking-tight text-zinc-900">
          Βαθμολόγιο
        </h1>
        <p className="mt-4 max-w-2xl text-base font-light text-zinc-600">
          Καταχωρήστε βαθμούς ανά μάθημα σε spreadsheet περιβάλλον. Κάθε στήλη
          αντιπροσωπεύει μια ημερομηνία ελέγχου.
        </p>
      </header>

      {configError && (
        <div className="mb-8 border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {configError}
        </div>
      )}

      {activeSubjectId ? (
        <GradeSpreadsheet
          students={students}
          subjects={subjects}
          initialSubjectId={activeSubjectId}
          initialColumns={spreadsheet.columns}
        />
      ) : (
        !configError && (
          <div className="border border-zinc-200 bg-white p-16 text-center">
            <p className="text-lg font-light text-zinc-600">
              Δεν υπάρχουν μαθήματα ακόμα.{" "}
              <Link href="/teacher/curriculum" className="text-zinc-900 underline">
                Προσθέστε ένα μάθημα
              </Link>{" "}
              για να ξεκινήσετε την καταχώρηση βαθμών.
            </p>
          </div>
        )
      )}

      <section className="mt-20 border-t border-zinc-200 pt-16">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-zinc-900">
              Μαθητές
            </h2>
            <p className="mt-2 text-sm font-light text-zinc-500">
              Διαχείριση μαθητών, QR codes και προσωπικών συνδέσμων.
            </p>
          </div>
          <Link
            href="/teacher/curriculum"
            className="border border-zinc-200 bg-white px-5 py-2.5 text-center text-sm tracking-wide text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900"
          >
            Διαχείριση Μαθημάτων
          </Link>
        </div>

        <StudentsTable students={students} />
      </section>
    </div>
  );
}
