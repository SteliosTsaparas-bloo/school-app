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

export type GradeEntry = {
  id: string;
  grade: number;
  entry_date: string;
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
