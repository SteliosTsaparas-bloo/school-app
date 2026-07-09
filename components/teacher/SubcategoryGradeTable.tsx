"use client";

import { useEffect, useState, useTransition } from "react";
import {
  updateColumnDate,
  upsertGradeCell,
  upsertGradeColumn,
} from "@/app/teacher/grades/actions";
import type { DateColumn, SpreadsheetCell, Student, SubcategorySpreadsheet } from "@/lib/types";

type SubcategoryGradeTableProps = {
  students: Student[];
  subcategory: SubcategorySpreadsheet;
  onStatus: (message: string | null) => void;
  onError: (message: string | null) => void;
};

type LocalDateColumn = DateColumn & { key: string };

function createEmptyColumn(students: Student[], date: string, key: string): LocalDateColumn {
  const cells: Record<string, SpreadsheetCell> = {};
  for (const student of students) {
    cells[student.id] = { id: null, grade: "", comments: "" };
  }
  return { key, assessment_date: date, cells };
}

function hydrateColumns(students: Student[], columns: DateColumn[]): LocalDateColumn[] {
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

export function SubcategoryGradeTable({
  students,
  subcategory,
  onStatus,
  onError,
}: SubcategoryGradeTableProps) {
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<LocalDateColumn[]>(() =>
    hydrateColumns(students, subcategory.columns),
  );

  useEffect(() => {
    setColumns(hydrateColumns(students, subcategory.columns));
  }, [students, subcategory.columns, subcategory.subcategory_id]);

  function updateCell(
    columnKey: string,
    studentId: string,
    patch: Partial<SpreadsheetCell>,
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

  function saveCell(column: LocalDateColumn, studentId: string) {
    const cell = column.cells[studentId];
    startTransition(async () => {
      onError(null);
      const result = await upsertGradeCell({
        studentId,
        subcategoryId: subcategory.subcategory_id,
        assessmentDate: column.assessment_date,
        grade: cell.grade,
        comments: cell.comments,
      });

      if (result.error) {
        onError(result.error);
        onStatus(null);
        return;
      }

      onStatus("Αποθηκεύτηκε");
      setTimeout(() => onStatus(null), 1500);
    });
  }

  function saveColumn(column: LocalDateColumn) {
    startTransition(async () => {
      onError(null);
      const result = await upsertGradeColumn({
        subcategoryId: subcategory.subcategory_id,
        assessmentDate: column.assessment_date,
        rows: students.map((student) => ({
          studentId: student.id,
          grade: column.cells[student.id].grade,
          comments: column.cells[student.id].comments,
        })),
      });

      if (result.error) {
        onError(result.error);
        onStatus(null);
        return;
      }

      onStatus(`Η στήλη αποθηκεύτηκε (${subcategory.subcategory_name})`);
      setTimeout(() => onStatus(null), 1800);
    });
  }

  function changeColumnDate(column: LocalDateColumn, newDate: string) {
    setColumns((current) =>
      current.map((entry) =>
        entry.key === column.key ? { ...entry, assessment_date: newDate } : entry,
      ),
    );

    const hasData = Object.values(column.cells).some(
      (cell) => cell.id || cell.grade.trim(),
    );

    if (!hasData) return;

    startTransition(async () => {
      onError(null);
      const result = await updateColumnDate({
        subcategoryId: subcategory.subcategory_id,
        oldDate: column.assessment_date,
        newDate,
      });

      if (result.error) {
        onError(result.error);
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-light tracking-tight text-zinc-900">
          {subcategory.subcategory_name}
        </h3>
        <button
          type="button"
          onClick={addColumn}
          className="border border-zinc-900 px-4 py-2 text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          + Προσθήκη Στήλης (Ημερομηνίας)
        </button>
      </div>

      {columns.length === 0 ? (
        <div className="border border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center text-sm text-zinc-500">
          Προσθέστε μια στήλη ημερομηνίας για να καταχωρήσετε βαθμούς.
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 bg-white">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="sticky left-0 z-10 min-w-[200px] border-r border-zinc-200 bg-zinc-50/95 px-4 py-4 text-xs font-normal tracking-[0.15em] text-zinc-500 uppercase">
                  Μαθητής
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="min-w-[140px] border-r border-zinc-100 px-3 py-3 align-top last:border-r-0"
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
      )}
    </section>
  );
}
