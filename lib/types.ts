export type Student = {
  id: string;
  name: string;
  unique_token: string;
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  sort_order: number;
};

export type GradeRecord = {
  id: string;
  student_id: string;
  subject_id: string;
  grade: number | null;
  comments: string | null;
  assessment_date: string;
  updated_at: string;
};

export type AssessmentGrade = {
  assessment_date: string;
  grade: number | null;
  comments: string | null;
  updated_at: string;
};

export type SubjectWithAssessments = {
  id: string;
  name: string;
  sort_order: number;
  assessments: AssessmentGrade[];
};

export type StudentDashboard = {
  student: Student;
  subjects: SubjectWithAssessments[];
};

export type SpreadsheetCell = {
  id: string | null;
  grade: string;
  comments: string;
};

export type SpreadsheetColumn = {
  assessment_date: string;
  cells: Record<string, SpreadsheetCell>;
};

export type SpreadsheetData = {
  students: Student[];
  subjects: Subject[];
  columns: SpreadsheetColumn[];
};
