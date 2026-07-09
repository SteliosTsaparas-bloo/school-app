"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createSubject,
  createSubcategory,
  deleteSubject,
  deleteSubcategory,
  updateSubject,
  updateSubcategory,
} from "@/app/teacher/curriculum/actions";
import type { SubjectWithSubcategories } from "@/lib/types";

type CurriculumManagerProps = {
  initialCurriculum: SubjectWithSubcategories[];
};

function isSuccessState(
  state: { error?: string; success?: boolean } | undefined,
) {
  return Boolean(state && "success" in state && state.success);
}

function useRefreshOnSuccess(
  success: boolean | undefined,
  onDone?: () => void,
) {
  const router = useRouter();

  useEffect(() => {
    if (!success) return;
    onDone?.();
    router.refresh();
  }, [success, onDone, router]);
}

function SubjectAddForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createSubject, undefined);
  useRefreshOnSuccess(isSuccessState(state), onCancel);

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-zinc-200 bg-zinc-50 p-4 sm:flex-row">
      <input
        name="name"
        type="text"
        required
        placeholder="Όνομα νέου μαθήματος"
        className="flex-1 border-b border-zinc-200 bg-transparent py-2 text-zinc-900 outline-none focus:border-zinc-900"
      />
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

function SubjectRow({ subject }: { subject: SubjectWithSubcategories }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(updateSubject, undefined);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteSubject, undefined);
  const [createSubState, createSubAction, isCreatingSub] = useActionState(
    createSubcategory,
    undefined,
  );

  useRefreshOnSuccess(isSuccessState(updateState), () => setIsEditing(false));
  useRefreshOnSuccess(isSuccessState(deleteState));
  useRefreshOnSuccess(isSuccessState(createSubState), () => setIsAddingSubcategory(false));

  return (
    <article className="border border-zinc-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        {isEditing ? (
          <form action={updateAction} className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input type="hidden" name="subjectId" value={subject.id} />
            <input
              name="name"
              defaultValue={subject.name}
              required
              className="flex-1 border-b border-zinc-200 bg-transparent py-2 text-lg font-light text-zinc-900 outline-none focus:border-zinc-900"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="border border-zinc-900 px-4 py-2 text-sm hover:bg-zinc-900 hover:text-white"
              >
                Αποθήκευση
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900"
              >
                Ακύρωση
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-xl font-light text-zinc-900">{subject.name}</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                Επεξεργασία
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubcategory(true)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                + Υποκατηγορία
              </button>
              <form action={deleteAction}>
                <input type="hidden" name="subjectId" value={subject.id} />
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="text-zinc-400 hover:text-red-600"
                >
                  Διαγραφή
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {(deleteState?.error || updateState?.error) && (
        <p className="px-6 py-2 text-sm text-red-600">
          {deleteState?.error ?? updateState?.error}
        </p>
      )}

      <div className="px-6 py-5">
        {subject.subcategories.length === 0 ? (
          <p className="text-sm font-light text-zinc-400">
            Δεν υπάρχουν υποκατηγορίες ακόμα.
          </p>
        ) : (
          <ul className="space-y-3">
            {subject.subcategories.map((subcategory) => (
              <SubcategoryRow key={subcategory.id} subcategory={subcategory} />
            ))}
          </ul>
        )}

        {isAddingSubcategory && (
          <form
            action={createSubAction}
            className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row"
          >
            <input type="hidden" name="subjectId" value={subject.id} />
            <input
              name="name"
              required
              autoFocus
              placeholder="Όνομα υποκατηγορίας"
              className="flex-1 border-b border-zinc-200 bg-transparent py-2 text-zinc-900 outline-none focus:border-zinc-900"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreatingSub}
                className="border border-zinc-900 px-4 py-2 text-sm hover:bg-zinc-900 hover:text-white"
              >
                Προσθήκη
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubcategory(false)}
                className="px-4 py-2 text-sm text-zinc-500"
              >
                Ακύρωση
              </button>
            </div>
            {createSubState?.error && (
              <p className="text-sm text-red-600 sm:w-full">{createSubState.error}</p>
            )}
          </form>
        )}
      </div>
    </article>
  );
}

function SubcategoryRow({
  subcategory,
}: {
  subcategory: SubjectWithSubcategories["subcategories"][number];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(
    updateSubcategory,
    undefined,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteSubcategory,
    undefined,
  );

  useRefreshOnSuccess(isSuccessState(updateState), () => setIsEditing(false));
  useRefreshOnSuccess(isSuccessState(deleteState));

  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {isEditing ? (
        <form action={updateAction} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input type="hidden" name="subcategoryId" value={subcategory.id} />
          <input
            name="name"
            defaultValue={subcategory.name}
            required
            className="flex-1 border-b border-zinc-200 bg-transparent py-1 text-zinc-900 outline-none focus:border-zinc-900"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={isUpdating} className="text-sm text-zinc-900">
              Αποθήκευση
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-zinc-500"
            >
              Ακύρωση
            </button>
          </div>
        </form>
      ) : (
        <>
          <span className="text-base font-light text-zinc-700">{subcategory.name}</span>
          <div className="flex gap-3 text-sm">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-zinc-400 hover:text-zinc-900"
            >
              Επεξεργασία
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="subcategoryId" value={subcategory.id} />
              <button
                type="submit"
                disabled={isDeleting}
                className="text-zinc-400 hover:text-red-600"
              >
                Διαγραφή
              </button>
            </form>
          </div>
        </>
      )}
      {deleteState?.error && <p className="text-sm text-red-600">{deleteState.error}</p>}
    </li>
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
          className="border border-zinc-900 px-5 py-2.5 text-sm tracking-wide text-zinc-900 hover:bg-zinc-900 hover:text-white"
        >
          + Προσθήκη Μαθήματος
        </button>
      </div>

      {isAddingSubject && <SubjectAddForm onCancel={() => setIsAddingSubject(false)} />}

      {initialCurriculum.length === 0 ? (
        <div className="border border-zinc-200 bg-white p-16 text-center">
          <p className="text-lg font-light text-zinc-600">Δεν υπάρχουν μαθήματα ακόμα.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialCurriculum.map((subject) => (
            <SubjectRow key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
