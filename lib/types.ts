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

export type Subcategory = {
  id: string;
  subject_id: string;
  name: string;
  sort_order: number;
};

export type SubjectWithSubcategories = Subject & {
  subcategories: Subcategory[];
};

export type GradeRecord = {
  id: string;
  student_id: string;
  subcategory_id: string;
  assessment_date: string;
  grade: number | null;
  comments: string | null;
  updated_at: string;
};

export type GradeEntry = {
  id: string;
  assessment_date: string;
  grade: number | null;
  comments: string | null;
  updated_at: string;
};

export type SubcategoryWithGrades = {
  id: string;
  name: string;
  sort_order: number;
  average: number | null;
  entries: GradeEntry[];
};

export type SubjectWithGrades = {
  id: string;
  name: string;
  sort_order: number;
  subcategories: SubcategoryWithGrades[];
};

export type StudentDashboard = {
  student: Student;
  subjects: SubjectWithGrades[];
};

export type SpreadsheetCell = {
  id: string | null;
  grade: string;
  comments: string;
};

export type DateColumn = {
  assessment_date: string;
  cells: Record<string, SpreadsheetCell>;
};

export type SubcategorySpreadsheet = {
  subcategory_id: string;
  subcategory_name: string;
  sort_order: number;
  columns: DateColumn[];
};

export type SpreadsheetData = {
  students: Student[];
  subjects: Subject[];
  subcategories: SubcategorySpreadsheet[];
};
