export function computeAverage(grades: number[]): number | null {
  if (grades.length === 0) {
    return null;
  }

  const sum = grades.reduce((total, grade) => total + grade, 0);
  return Math.round((sum / grades.length) * 10) / 10;
}

export function formatGrade(grade: number | null) {
  if (grade === null) {
    return "—";
  }

  return grade.toLocaleString("el-GR", {
    minimumFractionDigits: grade % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatShortDate(dateString: string) {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function parseGradeInput(value: string) {
  const grade = Number(value.replace(",", ".").trim());
  if (Number.isNaN(grade) || grade < 0 || grade > 10) {
    return null;
  }
  return grade;
}
