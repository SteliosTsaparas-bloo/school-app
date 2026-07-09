import type { Subject } from "./types";

export const SUBJECTS: { key: Subject; label: string }[] = [
  { key: "language", label: "Γλώσσα" },
  { key: "math", label: "Μαθηματικά" },
  { key: "history", label: "Ιστορία" },
  { key: "science", label: "Φυσική" },
  { key: "geography", label: "Γεωγραφία" },
  { key: "life_skills", label: "ΚΠΑ" },
  { key: "religion", label: "Θρησκευτικά" },
];

export const DEMO_STUDENT_TOKEN = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
