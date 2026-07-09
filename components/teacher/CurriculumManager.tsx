"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createSubject,
  deleteSubject,
  updateSubject,
} from "@/app/teacher/curriculum/actions";
import type { ActionResult } from "@/app/teacher/curriculum/actions";
import type { Subject } from "@/lib/types";
import { DeleteSubjectModal } from "./DeleteSubjectModal";

type CurriculumManagerProps = {
  initialSubjects: Subject[];
};

function isSuccess(state: ActionResult | undefined) {
  return Boolean(state?.success);
}

function useRefreshOnSuccess(state: ActionResult | undefined, onDone?: () => void) {
  const router = useRouter();

  useEffect(() => {
    if (!isSuccess(state)) return;
    onDone?.();
    router.refresh();
  }, [state, onDone, router]);
}

function SubjectAddForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createSubject, undefined);
  useRefreshOnSuccess(state, onCancel);

  return (
    <form action={formAction} className="border border-zinc-200 bg-white p-6">
      <p className="mb-4 text-sm tracking-[0.15em] text-zinc-500 uppercase">
        Νέο μάθημα
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <input
          name="name"
          type="text"
          required
          autoFocus
          placeholder="π.χ. Μαθηματικά"
          className="flex-1 border-b border-zinc-200 bg-transparent py-3 text-zinc-900 outline-none focus:border-zinc-900"
        />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="border border-zinc-200 px-4 py-2.5 text-sm">
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="border border-zinc-900 px-4 py-2.5 text-sm hover:bg-zinc-900 hover:text-white disabled:opacity-50"
          >
            Προσθήκη
          </button>
        </div>
      </div>
      {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(updateSubject, undefined);

  useRefreshOnSuccess(updateState, () => setIsEditing(false));

  return (
    <>
      <article className="border border-zinc-200 bg-white px-6 py-5">
        {isEditing ? (
          <form action={updateAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <input type="hidden" name="subjectId" value={subject.id} />
            <input
              name="name"
              defaultValue={subject.name}
              required
              className="flex-1 border-b border-zinc-200 bg-transparent py-2 text-2xl font-light text-zinc-900 outline-none focus:border-zinc-900"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsEditing(false)} className="border border-zinc-200 px-4 py-2 text-sm">
                Ακύρωση
              </button>
              <button type="submit" disabled={isUpdating} className="border border-zinc-900 px-4 py-2 text-sm hover:bg-zinc-900 hover:text-white">
                Αποθήκευση
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-light tracking-tight text-zinc-900">
              {subject.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-300"
              >
                Επεξεργασία
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="border border-zinc-200 px-4 py-2 text-sm text-zinc-500 hover:border-red-200 hover:text-red-600"
              >
                Διαγραφή
              </button>
            </div>
          </div>
        )}
        {updateState?.error && <p className="mt-3 text-sm text-red-600">{updateState.error}</p>}
      </article>

      <DeleteSubjectModal
        subject={subject}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
}

export function CurriculumManager({ initialSubjects }: CurriculumManagerProps) {
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsAddingSubject(true)}
          className="border border-zinc-900 px-5 py-2.5 text-sm tracking-wide text-zinc-900 hover:bg-zinc-900 hover:text-white"
        >
          + Προσθήκη Μαθήματος
        </button>
      </div>

      {isAddingSubject && <SubjectAddForm onCancel={() => setIsAddingSubject(false)} />}

      {initialSubjects.length === 0 ? (
        <div className="border border-zinc-200 bg-white p-16 text-center text-zinc-600">
          Δεν υπάρχουν μαθήματα ακόμα.
        </div>
      ) : (
        <div className="space-y-4">
          {initialSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
