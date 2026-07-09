"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SubcategoryGradeTable } from "@/components/teacher/SubcategoryGradeTable";
import type { Student, Subject, SubcategorySpreadsheet } from "@/lib/types";

type GradeSpreadsheetProps = {
  students: Student[];
  subjects: Subject[];
  initialSubjectId: string;
  initialSubcategories: SubcategorySpreadsheet[];
};

export function GradeSpreadsheet({
  students,
  subjects,
  initialSubjectId,
  initialSubcategories,
}: GradeSpreadsheetProps) {
  const [activeSubjectId, setActiveSubjectId] = useState(initialSubjectId);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSubject = subjects.find((subject) => subject.id === activeSubjectId);

  const subcategoryCountLabel = useMemo(
    () =>
      `${initialSubcategories.length} υποκατηγορ${initialSubcategories.length === 1 ? "ία" : "ίες"}`,
    [initialSubcategories.length],
  );

  const hasStudents = students.length > 0;

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
            Βαθμολόγιο
          </p>
          <h2 className="text-2xl font-light tracking-tight text-zinc-900">
            {activeSubject?.name ?? "Επιλογή μαθήματος"}
          </h2>
          <p className="mt-2 text-sm font-light text-zinc-500">
            {subcategoryCountLabel}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <label className="text-sm text-zinc-500" htmlFor="subject-select">
            Μάθημα
          </label>
          <select
            id="subject-select"
            value={activeSubjectId}
            onChange={(event) => {
              const nextSubjectId = event.target.value;
              setActiveSubjectId(nextSubjectId);
              window.location.href = `/teacher?subject=${nextSubjectId}`;
            }}
            className="min-w-[220px] border-b border-zinc-200 bg-transparent py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(status || error) && (
        <div
          className={[
            "border px-4 py-3 text-sm",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-zinc-200 bg-white text-zinc-600",
          ].join(" ")}
        >
          {error ?? status}
        </div>
      )}

      {!hasStudents ? (
        <div className="border border-zinc-200 bg-white p-16 text-center text-sm text-zinc-500">
          Προσθέστε μαθητές για να ξεκινήσετε την καταχώρηση βαθμών.
        </div>
      ) : subjects.length === 0 ? (
        <div className="border border-zinc-200 bg-white p-16 text-center text-sm text-zinc-500">
          Προσθέστε μαθήματα από τη σελίδα «Μαθήματα».
        </div>
      ) : initialSubcategories.length === 0 ? (
        <div className="border border-zinc-200 bg-white p-16 text-center text-sm text-zinc-500">
          Δεν υπάρχουν υποκατηγορίες για αυτό το μάθημα.{" "}
          <Link href="/teacher/curriculum" className="text-zinc-900 underline">
            Προσθέστε υποκατηγορίες
          </Link>{" "}
          για να ξεκινήσετε την καταχώρηση βαθμών.
        </div>
      ) : (
        <div className="space-y-16">
          {initialSubcategories.map((subcategory) => (
            <SubcategoryGradeTable
              key={subcategory.subcategory_id}
              students={students}
              subcategory={subcategory}
              onStatus={setStatus}
              onError={setError}
            />
          ))}
        </div>
      )}
    </section>
  );
}
