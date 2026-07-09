"use client";

import { useEffect, useState } from "react";
import type { StudentWithGrades } from "@/lib/data/students";
import { getStudentUrl } from "@/lib/utils/url";
import { AddStudentModal } from "./AddStudentModal";
import { GradeModal } from "./GradeModal";
import { QrLinkModal } from "./QrLinkModal";

type StudentsTableProps = {
  students: StudentWithGrades[];
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function StudentsTable({ students: initialStudents }: StudentsTableProps) {
  const [students, setStudents] = useState(initialStudents);
  const [qrStudent, setQrStudent] = useState<StudentWithGrades | null>(null);
  const [gradeStudent, setGradeStudent] = useState<StudentWithGrades | null>(
    null,
  );
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  function handleStudentCreated(student: StudentWithGrades) {
    setStudents((current) =>
      [...current, student].sort((a, b) => a.name.localeCompare(b.name, "el")),
    );
    setQrStudent(student);
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="border border-zinc-900 px-5 py-2.5 text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          + Προσθήκη Μαθητή
        </button>
      </div>

      {students.length === 0 ? (
        <div className="border border-zinc-200 bg-white p-16 text-center">
          <p className="text-lg font-light text-zinc-600">
            Δεν υπάρχουν μαθητές ακόμα στη βάση.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Πατήστε «Προσθήκη Μαθητή» για να ξεκινήσετε.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-normal tracking-[0.15em] text-zinc-500 uppercase">
                  Μαθητής
                </th>
                <th className="px-6 py-4 text-xs font-normal tracking-[0.15em] text-zinc-500 uppercase">
                  Εγγραφή
                </th>
                <th className="px-6 py-4 text-xs font-normal tracking-[0.15em] text-zinc-500 uppercase">
                  Ενέργειες
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <td className="px-6 py-5">
                    <p className="text-base font-light text-zinc-900">
                      {student.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {student.grades.length} / 7 μαθήματα
                    </p>
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-500">
                    {formatDate(student.created_at)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setQrStudent(student)}
                        className="border border-zinc-200 px-4 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                      >
                        Προβολή QR & Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeStudent(student)}
                        className="border border-zinc-900 px-4 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
                      >
                        Καταχώρηση Βαθμολογίας
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onStudentCreated={handleStudentCreated}
      />

      {qrStudent && (
        <QrLinkModal
          studentName={qrStudent.name}
          studentUrl={getStudentUrl(qrStudent.unique_token)}
          isOpen={Boolean(qrStudent)}
          onClose={() => setQrStudent(null)}
        />
      )}

      {gradeStudent && (
        <GradeModal
          key={gradeStudent.id}
          studentId={gradeStudent.id}
          studentName={gradeStudent.name}
          grades={gradeStudent.grades}
          isOpen={Boolean(gradeStudent)}
          onClose={() => setGradeStudent(null)}
        />
      )}
    </>
  );
}
