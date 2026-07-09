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
  grade: number | null;
  comments: string | null;
  updated_at: string;
};

export type SubcategoryGrade = {
  id: string;
  name: string;
  sort_order: number;
  grade: number | null;
  comments: string | null;
  updated_at: string | null;
};

export type SubjectWithGrades = {
  id: string;
  name: string;
  sort_order: number;
  subcategories: SubcategoryGrade[];
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

export type SpreadsheetColumn = {
  subcategory_id: string;
  subcategory_name: string;
  sort_order: number;
  cells: Record<string, SpreadsheetCell>;
};

export type SpreadsheetData = {
  students: Student[];
  subjects: Subject[];
  columns: SpreadsheetColumn[];
};
