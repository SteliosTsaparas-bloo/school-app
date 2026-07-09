import { notFound } from "next/navigation";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { getStudentDashboard } from "@/lib/data/students";

export const dynamic = "force-dynamic";

type StudentPageProps = {
  params: Promise<{ token: string }>;
};

export default async function StudentPage({ params }: StudentPageProps) {
  const { token } = await params;
  const dashboard = await getStudentDashboard(token);

  if (!dashboard) {
    notFound();
  }

  const { student, grades } = dashboard;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10 sm:py-28">
        <StudentDashboard studentName={student.name} grades={grades} />
      </div>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
          <p className="text-center text-sm text-zinc-400">
            Σχολική Πρόοδος · Ασφαλής πρόσβαση μέσω προσωπικού συνδέσμου
          </p>
        </div>
      </footer>
    </div>
  );
}
