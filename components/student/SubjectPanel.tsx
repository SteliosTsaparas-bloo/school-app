import type { Subject } from "@/lib/types";
import { SUBJECTS } from "@/lib/constants";

type SubjectPanelProps = {
  subject: Subject;
  grade: number | null;
  comments: string | null;
  updatedAt: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return null;

  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatGrade(grade: number | null) {
  if (grade === null) return "—";
  return grade.toLocaleString("el-GR", {
    minimumFractionDigits: grade % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function SubjectPanel({
  subject,
  grade,
  comments,
  updatedAt,
}: SubjectPanelProps) {
  const subjectLabel = SUBJECTS.find((s) => s.key === subject)?.label ?? "";
  const formattedDate = formatDate(updatedAt);

  return (
    <section className="transition-opacity duration-300">
      <div className="mb-12 flex items-end justify-between gap-8 border-b border-zinc-200 pb-10">
        <div>
          <p className="mb-2 text-sm text-zinc-500">Μάθημα</p>
          <h2 className="text-2xl font-light tracking-tight text-zinc-900">
            {subjectLabel}
          </h2>
        </div>

        <div className="text-right">
          <p className="mb-2 text-sm text-zinc-500">Βαθμός</p>
          <p className="text-5xl font-extralight tabular-nums text-zinc-900">
            {formatGrade(grade)}
            <span className="ml-1 text-lg text-zinc-400">/ 10</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm tracking-[0.15em] text-zinc-500 uppercase">
          Σχόλια δασκάλου
        </p>

        {comments ? (
          <p className="max-w-prose text-lg leading-relaxed font-light text-zinc-700">
            {comments}
          </p>
        ) : (
          <p className="text-lg font-light text-zinc-400 italic">
            Δεν υπάρχουν σχόλια ακόμα για αυτό το μάθημα.
          </p>
        )}
      </div>

      {formattedDate && (
        <p className="mt-16 text-sm text-zinc-400">
          Τελευταία ενημέρωση · {formattedDate}
        </p>
      )}
    </section>
  );
}
