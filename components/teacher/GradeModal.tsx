"use client";

import { useActionState, useEffect, useState } from "react";
import { upsertGrade } from "@/app/teacher/actions";
import { SUBJECTS } from "@/lib/constants";
import type { Grade, Subject } from "@/lib/types";

type GradeModalProps = {
  studentId: string;
  studentName: string;
  grades: Grade[];
  isOpen: boolean;
  onClose: () => void;
};

export function GradeModal({
  studentId,
  studentName,
  grades,
  isOpen,
  onClose,
}: GradeModalProps) {
  const [state, formAction, isPending] = useActionState(upsertGrade, undefined);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(
    grades[0]?.subject ?? SUBJECTS[0].key,
  );

  const selectedGrade = grades.find((g) => g.subject === selectedSubject);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-zinc-900/20"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-modal-title"
        className="relative w-full max-w-lg border border-zinc-200 bg-white p-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 transition-colors hover:text-zinc-900"
          aria-label="Κλείσιμο"
        >
          ✕
        </button>

        <header className="mb-10">
          <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
            Καταχώρηση βαθμολογίας
          </p>
          <h2
            id="grade-modal-title"
            className="text-2xl font-light tracking-tight text-zinc-900"
          >
            {studentName}
          </h2>
        </header>

        <form action={formAction} className="space-y-8">
          <input type="hidden" name="studentId" value={studentId} />

          <div>
            <label htmlFor="subject" className="mb-2 block text-sm text-zinc-500">
              Μάθημα
            </label>
            <select
              id="subject"
              name="subject"
              value={selectedSubject}
              onChange={(event) =>
                setSelectedSubject(event.target.value as Subject)
              }
              className="w-full border-b border-zinc-200 bg-transparent py-3 text-zinc-900 outline-none transition-colors focus:border-zinc-900"
            >
              {SUBJECTS.map(({ key, label }) => {
                const existing = grades.find((g) => g.subject === key);

                return (
                  <option key={key} value={key}>
                    {label}
                    {existing?.grade != null ? ` (${existing.grade})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="grade" className="mb-2 block text-sm text-zinc-500">
              Βαθμός (0–10)
            </label>
            <input
              id="grade"
              name="grade"
              type="text"
              inputMode="decimal"
              key={`grade-${selectedSubject}`}
              defaultValue={
                selectedGrade?.grade != null ? String(selectedGrade.grade) : ""
              }
              placeholder="π.χ. 8.5"
              className="w-full border-b border-zinc-200 bg-transparent py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="comments"
              className="mb-2 block text-sm text-zinc-500"
            >
              Σχόλια δασκάλου
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={4}
              key={`comments-${selectedSubject}`}
              defaultValue={selectedGrade?.comments ?? ""}
              placeholder="Προαιρετικά σχόλια για την πρόοδο του μαθητή..."
              className="w-full resize-none border border-zinc-200 bg-transparent px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-900"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-200 py-3 text-sm text-zinc-700 transition-colors hover:border-zinc-300"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 border border-zinc-900 py-3 text-sm text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Αποθήκευση..." : "Αποθήκευση"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
