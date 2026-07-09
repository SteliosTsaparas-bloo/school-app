import type { SubjectWithGrades } from "@/lib/types";
import { formatGrade, formatShortDate } from "@/lib/utils/grades";

type SubjectPanelProps = {
  subject: SubjectWithGrades;
};

export function SubjectPanel({ subject }: SubjectPanelProps) {
  const subjectAverage =
    subject.subcategories.length === 0
      ? null
      : (() => {
          const averages = subject.subcategories
            .map((subcategory) => subcategory.average)
            .filter((value): value is number => value !== null);
          if (averages.length === 0) return null;
          return (
            Math.round(
              (averages.reduce((sum, value) => sum + value, 0) / averages.length) * 10,
            ) / 10
          );
        })();

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
          <p className="mb-2 text-sm text-zinc-500">Γενικός μέσος όρος</p>
          <p className="text-5xl font-extralight tabular-nums text-zinc-900">
            {formatGrade(subjectAverage)}
            <span className="ml-1 text-lg text-zinc-400">/ 10</span>
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {subject.subcategories.length === 0 ? (
          <p className="text-lg font-light text-zinc-400">
            Δεν υπάρχουν υποκατηγορίες για αυτό το μάθημα.
          </p>
        ) : (
          subject.subcategories.map((subcategory) => (
            <article
              key={subcategory.id}
              className="border-b border-zinc-100 pb-10 last:border-b-0"
            >
              <div className="mb-6 flex items-end justify-between gap-6">
                <h3 className="text-xl font-light text-zinc-900">
                  {subcategory.name}
                </h3>
                <div className="text-right">
                  <p className="mb-1 text-xs text-zinc-500">Μέσος όρος</p>
                  <p className="text-3xl font-extralight tabular-nums text-zinc-900">
                    {formatGrade(subcategory.average)}
                  </p>
                </div>
              </div>

              {subcategory.entries.length > 0 ? (
                <ul className="space-y-3">
                  {subcategory.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-500">
                        {formatShortDate(entry.entry_date)}
                      </span>
                      <span className="tabular-nums text-zinc-900">
                        {formatGrade(entry.grade)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-light text-zinc-400">
                  Δεν υπάρχουν καταχωρήσεις ακόμα.
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
