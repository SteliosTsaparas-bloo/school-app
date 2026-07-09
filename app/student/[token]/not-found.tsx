import Link from "next/link";

export default function StudentNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6">
      <p className="mb-3 text-sm tracking-[0.2em] text-zinc-500 uppercase">
        Δεν βρέθηκε
      </p>
      <h1 className="mb-4 text-3xl font-light tracking-tight text-zinc-900">
        Μη έγκυρος σύνδεσμος
      </h1>
      <p className="mb-10 max-w-md text-center text-lg font-light text-zinc-600">
        Ο σύνδεσμος που ακολουθήσατε δεν αντιστοιχεί σε ενεργό προφίλ μαθητή.
      </p>
      <Link
        href="/"
        className="border border-zinc-900 px-8 py-3 text-sm tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
      >
        Επιστροφή στην αρχική
      </Link>
    </div>
  );
}
