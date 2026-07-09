"use client";

import { useState } from "react";
import type { Grade, Subject } from "@/lib/types";
import { SUBJECTS } from "@/lib/constants";
import { SubjectPanel } from "./SubjectPanel";

type StudentDashboardProps = {
  studentName: string;
  grades: Grade[];
};

export function StudentDashboard({ studentName, grades }: StudentDashboardProps) {
  const [activeSubject, setActiveSubject] = useState<Subject>("language");

  const activeGrade = grades.find((g) => g.subject === activeSubject);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-16 border-b border-zinc-200 pb-12">
        <p className="mb-3 text-sm tracking-[0.2em] text-zinc-500 uppercase">
          Πρόοδος μαθητή
        </p>
        <h1 className="text-4xl font-light tracking-tight text-zinc-900 sm:text-5xl">
          {studentName}
        </h1>
      </header>

      <nav
        aria-label="Μαθήματα"
        className="-mx-1 mb-14 overflow-x-auto scrollbar-none"
      >
        <ul className="flex min-w-max gap-1 px-1">
          {SUBJECTS.map(({ key, label }) => {
            const isActive = activeSubject === key;

            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setActiveSubject(key)}
                  className={[
                    "relative px-4 py-3 text-sm tracking-wide transition-colors duration-200",
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                  <span
                    className={[
                      "absolute inset-x-4 bottom-0 h-px origin-left bg-zinc-900 transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0",
                    ].join(" ")}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <SubjectPanel
        subject={activeSubject}
        grade={activeGrade?.grade ?? null}
        comments={activeGrade?.comments ?? null}
        updatedAt={activeGrade?.updated_at ?? null}
      />
    </div>
  );
}
