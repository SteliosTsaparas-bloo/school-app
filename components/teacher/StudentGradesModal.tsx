"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  addGradeEntry,
  deleteGradeEntry,
  loadStudentGrades,
} from "@/app/teacher/curriculum/actions";
import type { SubjectWithGrades } from "@/lib/types";
import { formatGrade, formatShortDate } from "@/lib/utils/grades";

type StudentGradesModalProps = {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
};

function GradeEntryForm({
  studentId,
  subcategoryId,
  onReload,
}: {
  studentId: string;
  subcategoryId: string;
  onReload: () => void;
}) {
  const [state, formAction, isPending] = useActionState(addGradeEntry, undefined);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      onReload();
    }
  }, [state?.success, onReload]);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="subcategoryId" value={subcategoryId} />
      <div className="flex-1">
        <label className="mb-1 block text-xs text-zinc-500">Ημερομηνία</label>
        <input
          type="date"
          name="entryDate"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full border-b border-zinc-200 bg-transparent py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>
      <div className="w-full sm:w-28">
        <label className="mb-1 block text-xs text-zinc-500">Βαθμός</label>
        <input
          name="grade"
          type="text"
          inputMode="decimal"
          required
          placeholder="8.5"
          className="w-full border-b border-zinc-200 bg-transparent py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="border border-zinc-900 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
      >
        {isPending ? "..." : "Προσθήκη"}
      </button>
      {state?.error && <p className="text-sm text-red-600 sm:w-full">{state.error}</p>}
    </form>
  );
}

function GradeEntryRow({
  entry,
  onReload,
}: {
  entry: SubjectWithGrades["subcategories"][number]["entries"][number];
  onReload: () => void;
}) {
  const [state, formAction, isPending] = useActionState(deleteGradeEntry, undefined);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      onReload();
    }
  }, [state?.success, onReload]);

  return (
    <li className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-zinc-500">{formatShortDate(entry.entry_date)}</span>
      <div className="flex items-center gap-4">
        <span className="tabular-nums text-zinc-900">{formatGrade(entry.grade)}</span>
        <form action={formAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <button
            type="submit"
            disabled={isPending}
            className="text-zinc-400 hover:text-red-600"
          >
            Διαγραφή
          </button>
        </form>
      </div>
    </li>
  );
}

export function StudentGradesModal({
  studentId,
  studentName,
  isOpen,
  onClose,
}: StudentGradesModalProps) {
  const [subjects, setSubjects] = useState<SubjectWithGrades[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      const data = await loadStudentGrades(studentId);
      setSubjects(data ?? []);
      setActiveSubjectId((current) => {
        if (current && data?.some((subject) => subject.id === current)) {
          return current;
        }
        return data?.[0]?.id ?? null;
      });
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    reload();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, studentId]);

  if (!isOpen) return null;

  const activeSubject = subjects.find((subject) => subject.id === activeSubjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-zinc-900/20"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col border border-zinc-200 bg-white">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-6 sm:px-8">
          <div>
            <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
              Καταχώρηση βαθμολογίας
            </p>
            <h2 className="text-2xl font-light tracking-tight text-zinc-900">
              {studentName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900"
            aria-label="Κλείσιμο"
          >
            ✕
          </button>
        </div>

        {isPending && subjects.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-16 text-sm text-zinc-400">
            Φόρτωση...
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-16 text-center text-sm text-zinc-500">
            Δεν υπάρχουν μαθήματα. Προσθέστε μαθήματα από τη σελίδα «Μαθήματα».
          </div>
        ) : (
          <>
            <nav className="overflow-x-auto border-b border-zinc-200 px-4 scrollbar-none sm:px-6">
              <ul className="flex min-w-max gap-1">
                {subjects.map((subject) => {
                  const isActive = subject.id === activeSubjectId;
                  return (
                    <li key={subject.id}>
                      <button
                        type="button"
                        onClick={() => setActiveSubjectId(subject.id)}
                        className={[
                          "relative px-4 py-3 text-sm transition-colors",
                          isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
                        ].join(" ")}
                      >
                        {subject.name}
                        <span
                          className={[
                            "absolute inset-x-4 bottom-0 h-px bg-zinc-900 transition-transform",
                            isActive ? "scale-x-100" : "scale-x-0",
                          ].join(" ")}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              {!activeSubject || activeSubject.subcategories.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Δεν υπάρχουν υποκατηγορίες για αυτό το μάθημα.
                </p>
              ) : (
                <div className="space-y-8">
                  {activeSubject.subcategories.map((subcategory) => (
                    <section
                      key={subcategory.id}
                      className="border-b border-zinc-100 pb-8 last:border-b-0"
                    >
                      <div className="mb-4 flex items-end justify-between gap-4">
                        <h3 className="text-lg font-light text-zinc-900">
                          {subcategory.name}
                        </h3>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">Μέσος όρος</p>
                          <p className="text-2xl font-extralight tabular-nums text-zinc-900">
                            {formatGrade(subcategory.average)}
                          </p>
                        </div>
                      </div>

                      {subcategory.entries.length > 0 ? (
                        <ul className="divide-y divide-zinc-100">
                          {subcategory.entries.map((entry) => (
                            <GradeEntryRow
                              key={entry.id}
                              entry={entry}
                              onReload={reload}
                            />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm font-light text-zinc-400">
                          Δεν υπάρχουν καταχωρήσεις ακόμα.
                        </p>
                      )}

                      <GradeEntryForm
                        studentId={studentId}
                        subcategoryId={subcategory.id}
                        onReload={reload}
                      />
                    </section>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
