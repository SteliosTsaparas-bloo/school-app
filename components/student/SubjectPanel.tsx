import type { SubjectWithAssessments } from "@/lib/types";
import { formatGrade, formatShortDate } from "@/lib/utils/grades";

type SubjectPanelProps = {
  subject: SubjectWithAssessments;
};

export function SubjectPanel({ subject }: SubjectPanelProps) {
  const grades = subject.assessments
    .map((assessment) => assessment.grade)
    .filter((grade): grade is number => grade !== null);

  const subjectAverage =
    grades.length === 0
      ? null
      : Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 10) /
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

      <div className="space-y-4">
        <p className="text-sm tracking-[0.15em] text-zinc-500 uppercase">
          Ιστορικό βαθμολογίας
        </p>

        {subject.assessments.length === 0 ? (
          <p className="text-lg font-light text-zinc-400 italic">
            Δεν υπάρχουν καταχωρήσεις ακόμα για αυτό το μάθημα.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 border border-zinc-200 bg-white">
            {subject.assessments.map((assessment) => (
              <li
                key={assessment.assessment_date}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-zinc-500">
                    {formatShortDate(assessment.assessment_date)}
                  </p>
                  {assessment.comments && (
                    <p className="mt-2 max-w-prose text-sm font-light leading-relaxed text-zinc-700">
                      {assessment.comments}
                    </p>
                  )}
                </div>
                <p className="text-3xl font-extralight tabular-nums text-zinc-900">
                  {formatGrade(assessment.grade)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
