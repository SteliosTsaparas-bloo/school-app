import type { StudentDashboard } from "./types";
import { DEMO_STUDENT_TOKEN } from "./constants";

export const mockStudentDashboard: StudentDashboard = {
  student: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Μαρία Παπαδοπούλου",
    unique_token: DEMO_STUDENT_TOKEN,
    created_at: "2026-01-15T08:00:00.000Z",
  },
  grades: [
    {
      subject: "language",
      grade: 9.5,
      comments:
        "Εξαιρετική έκθεση. Πολύ καλή ορθογραφία και εκφραστική δεινότητα.",
      updated_at: "2026-03-20T10:30:00.000Z",
    },
    {
      subject: "math",
      grade: 8.0,
      comments:
        "Καλή κατανόηση στις πράξεις. Χρειάζεται περισσότερη εξάσκηση στα κλάσματα.",
      updated_at: "2026-03-18T14:00:00.000Z",
    },
    {
      subject: "history",
      grade: 9.0,
      comments:
        "Ενεργή συμμετοχή στο μάθημα. Θυμάται καλά τις ημερομηνίες.",
      updated_at: "2026-03-15T09:15:00.000Z",
    },
    {
      subject: "science",
      grade: 8.5,
      comments: "Ενδιαφέρον για τα πειράματα. Προσεκτική παρατήρηση.",
      updated_at: "2026-03-12T11:45:00.000Z",
    },
    {
      subject: "geography",
      grade: 7.5,
      comments:
        "Καλή γνώση της Ελλάδας. Να μελετήσει περισσότερο τους χάρτες.",
      updated_at: "2026-03-10T16:20:00.000Z",
    },
    {
      subject: "life_skills",
      grade: 10.0,
      comments: "Συνεργατική και ευγενική με τους συμμαθητές της.",
      updated_at: "2026-03-22T08:00:00.000Z",
    },
    {
      subject: "religion",
      grade: 9.0,
      comments: "Σεβασμός και ενδιαφέρον για τα θρησκευτικά κείμενα.",
      updated_at: "2026-03-08T13:30:00.000Z",
    },
  ],
};
