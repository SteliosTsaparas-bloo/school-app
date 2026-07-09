import type { SubjectWithGrades } from "@/lib/types";
import { formatGrade, formatShortDate } from "@/lib/utils/grades";

type SubjectPanelProps = {
  subject: SubjectWithGrades;
};

export function SubjectPanel({ subject }: SubjectPanelProps) {
  const allGrades = subject.subcategories.flatMap((subcategory) =>
    subcategory.entries
      .map((entry) => entry.grade)
      .filter((grade): grade is number => grade !== null),
  );

  const subjectAverage =
    allGrades.length === 0
      ? null
      : Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) /
        10;

  return (
    <section className="transition-opacity duration-300">
      <div className="mb-12 flex items-end justify-between gap-8 border-b border-zinc-200 pb-10">
        <div>
          <p className="mb-2 text-sm text-zinc-500">Μάθημα</p>
          <h2 className="text-2xl font-light tracking-tight text-zinc-900">
            {subject.name}
          </h2>
        </div>

        <div className="text-right">
          <p className="mb-2 text-sm text-zinc-500">Μέσος όρος</p>
          <p className="text-5xl font-extralight tabular-nums text-zinc-900">
            {formatGrade(subjectAverage)}
            <span className="ml-1 text-lg text-zinc-400">/ 10</span>
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {subject.subcategories.length === 0 ? (
          <p className="text-lg font-light text-zinc-400 italic">
            Δεν υπάρχουν καταχωρήσεις ακόμα για αυτό το μάθημα.
          </p>
        ) : (
          subject.subcategories.map((subcategory) => (
            <div key={subcategory.id} className="space-y-4">
              <div className="flex items-end justify-between gap-4 border-b border-zinc-100 pb-3">
                <p className="text-base font-light text-zinc-900">{subcategory.name}</p>
                <p className="text-sm text-zinc-500">
                  Μ.Ο.{" "}
                  <span className="tabular-nums text-zinc-900">
                    {formatGrade(subcategory.average)}
                  </span>
                </p>
              </div>

              {subcategory.entries.length === 0 ? (
                <p className="text-sm font-light text-zinc-400 italic">
                  Δεν υπάρχουν καταχωρήσεις.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100 border border-zinc-200 bg-white">
                  {subcategory.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm text-zinc-500">
                          {formatShortDate(entry.assessment_date)}
                        </p>
                        {entry.comments && (
                          <p className="mt-2 max-w-prose text-sm font-light leading-relaxed text-zinc-700">
                            {entry.comments}
                          </p>
                        )}
                      </div>
                      <p className="text-3xl font-extralight tabular-nums text-zinc-900">
                        {formatGrade(entry.grade)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
