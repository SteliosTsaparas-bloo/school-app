"use client";

import { useState } from "react";
import type { SubjectWithGrades } from "@/lib/types";
import { SubjectPanel } from "./SubjectPanel";

type StudentDashboardProps = {
  studentName: string;
  subjects: SubjectWithGrades[];
};

export function StudentDashboard({
  studentName,
  subjects,
}: StudentDashboardProps) {
  const [activeSubjectId, setActiveSubjectId] = useState(subjects[0]?.id ?? "");

  const activeSubject =
    subjects.find((subject) => subject.id === activeSubjectId) ?? subjects[0];

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

      {subjects.length === 0 ? (
        <p className="text-lg font-light text-zinc-400">
          Δεν υπάρχουν μαθήματα ακόμα.
        </p>
      ) : (
        <>
          <nav
            aria-label="Μαθήματα"
            className="-mx-1 mb-14 overflow-x-auto scrollbar-none"
          >
            <ul className="flex min-w-max gap-1 px-1">
              {subjects.map((subject) => {
                const isActive = activeSubject?.id === subject.id;

                return (
                  <li key={subject.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSubjectId(subject.id)}
                      className={[
                        "relative px-4 py-3 text-sm tracking-wide transition-colors duration-200",
                        isActive
                          ? "text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-700",
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {subject.name}
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

          {activeSubject && <SubjectPanel subject={activeSubject} />}
        </>
      )}
    </div>
  );
}
