import Link from "next/link";

export function UnauthorizedAccess() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm tracking-[0.2em] text-zinc-500 uppercase">
        Δεν επιτρέπεται
      </p>
      <h1 className="mb-4 text-3xl font-light tracking-tight text-zinc-900">
        Μη εξουσιοδοτημένη πρόσβαση
      </h1>
      <p className="mb-10 max-w-md text-lg font-light leading-relaxed text-zinc-600">
        Χρειάζεστε έγκυρο magic link για πρόσβαση στο dashboard του δασκάλου.
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
