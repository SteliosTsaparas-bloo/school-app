import Link from "next/link";
import { TeacherNav } from "@/components/teacher/TeacherNav";
import { isTeacherAuthenticated } from "@/lib/auth/teacher";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await isTeacherAuthenticated();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
          <Link
            href="/teacher"
            className="text-sm tracking-[0.15em] text-zinc-900 uppercase transition-colors hover:text-zinc-600"
          >
            School App
          </Link>

          {isAuthenticated && <TeacherNav />}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20">
        {children}
      </main>
    </div>
  );
}
