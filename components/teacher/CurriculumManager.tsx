"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createSubject,
  createSubcategory,
  updateSubject,
  updateSubcategory,
} from "@/app/teacher/curriculum/actions";
import type { ActionResult } from "@/app/teacher/curriculum/actions";
import type { SubjectWithSubcategories, Subcategory } from "@/lib/types";
import { DeleteSubcategoryModal } from "./DeleteSubcategoryModal";
import { DeleteSubjectModal } from "./DeleteSubjectModal";

type CurriculumManagerProps = {
  initialCurriculum: SubjectWithSubcategories[];
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
        <div className="flex-1">
          <label htmlFor="new-subject-name" className="mb-2 block text-sm text-zinc-500">
            Όνομα μαθήματος
          </label>
          <input
            id="new-subject-name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="π.χ. Μαθηματικά"
            className="w-full border-b border-zinc-200 bg-transparent py-3 text-zinc-900 outline-none focus:border-zinc-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 hover:border-zinc-300"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="border border-zinc-900 px-4 py-2.5 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
          >
            {isPending ? "..." : "Προσθήκη"}
          </button>
        </div>
      </div>
      {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function SubcategoryAddForm({
  subjectId,
  onCancel,
}: {
  subjectId: string;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createSubcategory, undefined);
  useRefreshOnSuccess(state, onCancel);

  return (
    <form action={formAction} className="mt-4 border border-zinc-200 bg-zinc-50 p-4">
      <input type="hidden" name="subjectId" value={subjectId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm text-zinc-500">
            Όνομα υποκατηγορίας
          </label>
          <input
            name="name"
            required
            autoFocus
            placeholder="π.χ. Διαγώνισμα"
            className="w-full border-b border-zinc-200 bg-transparent py-2 text-zinc-900 outline-none focus:border-zinc-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-zinc-200 px-4 py-2 text-sm text-zinc-700"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="border border-zinc-900 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-white"
          >
            {isPending ? "..." : "Προσθήκη"}
          </button>
        </div>
      </div>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function SubcategoryRow({
  subcategory,
  subjectName,
}: {
  subcategory: Subcategory;
  subjectName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(
    updateSubcategory,
    undefined,
  );

  useRefreshOnSuccess(updateState, () => setIsEditing(false));

  return (
    <>
      <li className="border border-zinc-100 bg-zinc-50/50 px-4 py-4">
        {isEditing ? (
          <form action={updateAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="subcategoryId" value={subcategory.id} />
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-500">Υποκατηγορία</label>
              <input
                name="name"
                defaultValue={subcategory.name}
                required
                className="w-full border-b border-zinc-200 bg-transparent py-2 text-zinc-900 outline-none focus:border-zinc-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="border border-zinc-900 px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                Αποθήκευση
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-base font-light text-zinc-800">
              {subcategory.name}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-300"
              >
                Επεξεργασία
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 hover:border-red-200 hover:text-red-600"
              >
                Διαγραφή
              </button>
            </div>
          </div>
        )}
        {updateState?.error && (
          <p className="mt-2 text-sm text-red-600">{updateState.error}</p>
        )}
      </li>

      <DeleteSubcategoryModal
        subcategory={subcategory}
        subjectName={subjectName}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
}

function SubjectCard({ subject }: { subject: SubjectWithSubcategories }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(updateSubject, undefined);

  useRefreshOnSuccess(updateState, () => setIsEditing(false));

  return (
    <>
      <article className="border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-5">
          {isEditing ? (
            <form action={updateAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <input type="hidden" name="subjectId" value={subject.id} />
              <div className="flex-1">
                <label className="mb-2 block text-sm text-zinc-500">Μάθημα</label>
                <input
                  name="name"
                  defaultValue={subject.name}
                  required
                  className="w-full border-b border-zinc-200 bg-transparent py-2 text-2xl font-light text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="border border-zinc-200 px-4 py-2 text-sm text-zinc-700"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="border border-zinc-900 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
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
                  className="border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                >
                  Επεξεργασία
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubcategory(true)}
                  className="border border-zinc-900 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
                  + Υποκατηγορία
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
          {updateState?.error && (
            <p className="mt-3 text-sm text-red-600">{updateState.error}</p>
          )}
        </div>

        <div className="px-6 py-5">
          <p className="mb-4 text-xs tracking-[0.15em] text-zinc-500 uppercase">
            Υποκατηγορίες ({subject.subcategories.length})
          </p>

          {subject.subcategories.length === 0 ? (
            <p className="mb-4 text-sm font-light text-zinc-400">
              Δεν υπάρχουν υποκατηγορίες. Προσθέστε μία για να καταχωρείτε βαθμούς.
            </p>
          ) : (
            <ul className="space-y-3">
              {subject.subcategories.map((subcategory) => (
                <SubcategoryRow
                  key={subcategory.id}
                  subcategory={subcategory}
                  subjectName={subject.name}
                />
              ))}
            </ul>
          )}

          {isAddingSubcategory && (
            <SubcategoryAddForm
              subjectId={subject.id}
              onCancel={() => setIsAddingSubcategory(false)}
            />
          )}
        </div>
      </article>

      <DeleteSubjectModal
        subject={subject}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
}

export function CurriculumManager({ initialCurriculum }: CurriculumManagerProps) {
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsAddingSubject(true)}
          className="border border-zinc-900 px-5 py-2.5 text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          + Προσθήκη Μαθήματος
        </button>
      </div>

      {isAddingSubject && (
        <SubjectAddForm onCancel={() => setIsAddingSubject(false)} />
      )}

      {initialCurriculum.length === 0 ? (
        <div className="border border-zinc-200 bg-white p-16 text-center">
          <p className="text-lg font-light text-zinc-600">
            Δεν υπάρχουν μαθήματα ακόμα.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Πατήστε «Προσθήκη Μαθήματος» για να ξεκινήσετε.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {initialCurriculum.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
