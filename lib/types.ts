export type Subject =
  | "language"
  | "math"
  | "history"
  | "science"
  | "geography"
  | "life_skills"
  | "religion";

export type Student = {
  id: string;
  name: string;
  unique_token: string;
  created_at: string;
};

export type Grade = {
  subject: Subject;
  grade: number | null;
  comments: string | null;
  updated_at: string;
};

export type StudentDashboard = {
  student: Student;
  grades: Grade[];
};
