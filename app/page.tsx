import Link from "next/link";
import { DEMO_STUDENT_TOKEN } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-lg text-center">
          <p className="mb-4 text-sm tracking-[0.25em] text-zinc-500 uppercase">
            Σχολική Πρόοδος
          </p>
          <h1 className="mb-6 text-4xl font-light tracking-tight text-zinc-900 sm:text-5xl">
            School App
          </h1>
          <p className="mb-16 text-lg font-light leading-relaxed text-zinc-600">
            Minimal dashboard για δασκάλους και γονείς. Παρακολουθήστε την
            πρόοδο κάθε μαθητή ανά μάθημα.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/student/${DEMO_STUDENT_TOKEN}`}
              className="border border-zinc-900 px-8 py-3 text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              Προβολή Demo Μαθητή
            </Link>
            <Link
              href="/teacher"
              className="border border-zinc-200 bg-white px-8 py-3 text-sm tracking-wide text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900"
            >
              Dashboard Δασκάλου
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
