"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudent } from "@/app/teacher/actions";
import type { StudentRow } from "@/lib/data/students";

type AddStudentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated: (student: StudentRow) => void;
};

export function AddStudentModal({
  isOpen,
  onClose,
  onStudentCreated,
}: AddStudentModalProps) {
  const [state, formAction, isPending] = useActionState(createStudent, undefined);
  const handledStudentId = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handledStudentId.current = null;
      return;
    }

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
    if (!isOpen || !state?.success || !state.student) return;
    if (handledStudentId.current === state.student.id) return;

    handledStudentId.current = state.student.id;
    onStudentCreated(state.student);
    onClose();
  }, [isOpen, state, onClose, onStudentCreated]);

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
        aria-labelledby="add-student-title"
        className="relative w-full max-w-md border border-zinc-200 bg-white p-10"
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
            Νέος μαθητής
          </p>
          <h2
            id="add-student-title"
            className="text-2xl font-light tracking-tight text-zinc-900"
          >
            Προσθήκη Μαθητή
          </h2>
        </header>

        <form action={formAction} className="space-y-8">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-zinc-500">
              Ονοματεπώνυμο
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="π.χ. Μαρία Παπαδοπούλου"
              className="w-full border-b border-zinc-200 bg-transparent py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-900"
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
