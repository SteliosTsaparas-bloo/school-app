"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { deleteSubcategory } from "@/app/teacher/curriculum/actions";
import type { Subcategory } from "@/lib/types";

type DeleteSubcategoryModalProps = {
  subcategory: Subcategory;
  subjectName: string;
  isOpen: boolean;
  onClose: () => void;
};

export function DeleteSubcategoryModal({
  subcategory,
  subjectName,
  isOpen,
  onClose,
}: DeleteSubcategoryModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(deleteSubcategory, undefined);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
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
      router.refresh();
    }
  }, [state?.success, onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-zinc-900/20"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md border border-zinc-200 bg-white p-10">
        <header className="mb-6">
          <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
            Διαγραφή υποκατηγορίας · {subjectName}
          </p>
          <h2 className="text-2xl font-light tracking-tight text-zinc-900">
            {subcategory.name}
          </h2>
        </header>

        <p className="mb-10 text-base font-light leading-relaxed text-zinc-600">
          Θα διαγραφούν οριστικά όλοι οι ημερήσιοι βαθμοί αυτής της
          υποκατηγορίας.
        </p>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="subcategoryId" value={subcategory.id} />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-200 py-3 text-sm text-zinc-700 hover:border-zinc-300"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 border border-red-600 py-3 text-sm text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              {isPending ? "Διαγραφή..." : "Οριστική Διαγραφή"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
