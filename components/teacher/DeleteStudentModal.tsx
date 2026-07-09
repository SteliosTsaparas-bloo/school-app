"use client";

import { useActionState, useEffect } from "react";
import { deleteStudent } from "@/app/teacher/actions";
import type { StudentWithGrades } from "@/lib/data/students";

type DeleteStudentModalProps = {
  student: StudentWithGrades;
  isOpen: boolean;
  onClose: () => void;
  onStudentDeleted: (studentId: string) => void;
};

export function DeleteStudentModal({
  student,
  isOpen,
  onClose,
  onStudentDeleted,
}: DeleteStudentModalProps) {
  const [state, formAction, isPending] = useActionState(deleteStudent, undefined);

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
    if (state?.success && state.studentId) {
      onStudentDeleted(state.studentId);
      onClose();
    }
  }, [state, onClose, onStudentDeleted]);

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
        aria-labelledby="delete-student-title"
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

        <header className="mb-6">
          <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
            Διαγραφή
          </p>
          <h2
            id="delete-student-title"
            className="text-2xl font-light tracking-tight text-zinc-900"
          >
            {student.name}
          </h2>
        </header>

        <p className="mb-10 text-base font-light leading-relaxed text-zinc-600">
          Θα διαγραφούν οριστικά όλα τα στοιχεία του μαθητή, συμπεριλαμβανομένης
          της βαθμολογίας. Ο προσωπικός σύνδεσμος και το QR Code θα σταματήσουν
          να λειτουργούν.
        </p>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="studentId" value={student.id} />

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
              className="flex-1 border border-red-600 py-3 text-sm text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Διαγραφή..." : "Οριστική Διαγραφή"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
