"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  updateColumnDate,
  upsertGradeCell,
  upsertGradeColumn,
} from "@/app/teacher/grades/actions";
import type { SpreadsheetColumn, Student, Subject } from "@/lib/types";

type GradeSpreadsheetProps = {
  students: Student[];
  subjects: Subject[];
  initialSubjectId: string;
  initialColumns: SpreadsheetColumn[];
};

type LocalColumn = SpreadsheetColumn & { key: string };

function createEmptyColumn(students: Student[], date: string, key: string): LocalColumn {
  const cells: LocalColumn["cells"] = {};
  for (const student of students) {
    cells[student.id] = { id: null, grade: "", comments: "" };
  }
  return { key, assessment_date: date, cells };
}

function hydrateColumns(
  students: Student[],
  columns: SpreadsheetColumn[],
): LocalColumn[] {
  return columns.map((column, index) => {
    const cells = { ...column.cells };
    for (const student of students) {
      cells[student.id] ??= { id: null, grade: "", comments: "" };
    }
    return {
      ...column,
      key: `${column.assessment_date}-${index}`,
      cells,
    };
  });
}

export function GradeSpreadsheet({
  students,
  subjects,
  initialSubjectId,
  initialColumns,
}: GradeSpreadsheetProps) {
  const [activeSubjectId, setActiveSubjectId] = useState(initialSubjectId);
  const [columns, setColumns] = useState<LocalColumn[]>(() =>
    hydrateColumns(students, initialColumns),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeSubject = subjects.find((subject) => subject.id === activeSubjectId);

  useEffect(() => {
    setColumns(hydrateColumns(students, initialColumns));
  }, [students, initialColumns, activeSubjectId]);

  function updateCell(
    columnKey: string,
    studentId: string,
    patch: Partial<LocalColumn["cells"][string]>,
  ) {
    setColumns((current) =>
      current.map((column) =>
        column.key === columnKey
          ? {
              ...column,
              cells: {
                ...column.cells,
                [studentId]: { ...column.cells[studentId], ...patch },
              },
            }
          : column,
      ),
    );
  }

  function addColumn() {
    const today = new Date().toISOString().slice(0, 10);
    setColumns((current) => [
      ...current,
      createEmptyColumn(students, today, `new-${Date.now()}`),
    ]);
  }

  function saveCell(column: LocalColumn, studentId: string) {
    const cell = column.cells[studentId];
    startTransition(async () => {
      setError(null);
      const result = await upsertGradeCell({
        studentId,
        subjectId: activeSubjectId,
        assessmentDate: column.assessment_date,
        grade: cell.grade,
        comments: cell.comments,
      });

      if (result.error) {
        setError(result.error);
        setStatus(null);
        return;
      }

      setStatus("Αποθηκεύτηκε");
      setTimeout(() => setStatus(null), 1500);
    });
  }

  function saveColumn(column: LocalColumn) {
    startTransition(async () => {
      setError(null);
      const result = await upsertGradeColumn({
        subjectId: activeSubjectId,
        assessmentDate: column.assessment_date,
        rows: students.map((student) => ({
          studentId: student.id,
          grade: column.cells[student.id].grade,
          comments: column.cells[student.id].comments,
        })),
      });

      if (result.error) {
        setError(result.error);
        setStatus(null);
        return;
      }

      setStatus("Η στήλη αποθηκεύτηκε");
      setTimeout(() => setStatus(null), 1800);
    });
  }

  function changeColumnDate(column: LocalColumn, newDate: string) {
    setColumns((current) =>
      current.map((entry) =>
        entry.key === column.key ? { ...entry, assessment_date: newDate } : entry,
      ),
    );

    if (!column.cells || Object.values(column.cells).every((cell) => !cell.id && !cell.grade)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await updateColumnDate({
        subjectId: activeSubjectId,
        oldDate: column.assessment_date,
        newDate,
      });

      if (result.error) {
        setError(result.error);
      }
    });
  }

  const hasStudents = students.length > 0;
  const columnCountLabel = useMemo(
    () => `${columns.length} στήλ${columns.length === 1 ? "η" : "ες"}`,
    [columns.length],
  );

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
            Βαθμολόγιο
          </p>
          <h2 className="text-2xl font-light tracking-tight text-zinc-900">
            {activeSubject?.name ?? "Επιλογή μαθήματος"}
          </h2>
          <p className="mt-2 text-sm font-light text-zinc-500">{columnCountLabel}</p>
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
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addColumn}
              className="border border-zinc-900 px-5 py-2.5 text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              + Προσθήκη Νέας Στήλης (Ημερομηνίας)
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-200 bg-white">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="sticky left-0 z-10 min-w-[220px] border-r border-zinc-200 bg-zinc-50/95 px-4 py-4 text-xs font-normal tracking-[0.15em] text-zinc-500 uppercase">
                    Μαθητής
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="min-w-[180px] border-r border-zinc-100 px-3 py-3 align-top last:border-r-0"
                    >
                      <div className="space-y-3">
                        <input
                          type="date"
                          value={column.assessment_date}
                          onChange={(event) =>
                            changeColumnDate(column, event.target.value)
                          }
                          className="w-full border-b border-zinc-200 bg-transparent py-1 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={() => saveColumn(column)}
                          disabled={isPending}
                          className="w-full border border-zinc-200 px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50"
                        >
                          Αποθήκευση Στήλης
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-zinc-100 last:border-b-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-r border-zinc-200 bg-white px-4 py-3 text-left text-sm font-normal text-zinc-900"
                    >
                      {student.name}
                    </th>
                    {columns.map((column) => {
                      const cell = column.cells[student.id];
                      return (
                        <td
                          key={`${column.key}-${student.id}`}
                          className="border-r border-zinc-100 px-3 py-3 align-top last:border-r-0"
                        >
                          <div className="space-y-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={cell.grade}
                              placeholder="—"
                              onChange={(event) =>
                                updateCell(column.key, student.id, {
                                  grade: event.target.value,
                                })
                              }
                              onBlur={() => saveCell(column, student.id)}
                              className="w-full border-b border-zinc-200 bg-transparent py-1 text-center text-sm tabular-nums text-zinc-900 outline-none focus:border-zinc-900"
                            />
                            <input
                              type="text"
                              value={cell.comments}
                              placeholder="Σχόλιο"
                              title={cell.comments || "Σχόλιο"}
                              onChange={(event) =>
                                updateCell(column.key, student.id, {
                                  comments: event.target.value,
                                })
                              }
                              onBlur={() => saveCell(column, student.id)}
                              className="w-full border border-zinc-100 bg-transparent px-2 py-1 text-xs text-zinc-500 outline-none focus:border-zinc-300"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
