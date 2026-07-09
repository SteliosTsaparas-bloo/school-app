export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:px-10">
        <div className="w-full max-w-xl text-center">
          <p className="mb-6 text-sm tracking-[0.25em] text-zinc-500 uppercase">
            Σχολική Πρόοδος
          </p>

          <p className="text-2xl font-light leading-relaxed tracking-tight text-zinc-900 sm:text-3xl sm:leading-relaxed">
            Η πρόσβαση στην πλατφόρμα γίνεται αποκλειστικά μέσω του προσωπικού
            QR Code που σας έχει δοθεί από τον δάσκαλο της τάξης.
          </p>

          <p className="mt-10 text-lg font-light leading-relaxed text-zinc-600">
            Παρακαλώ σκανάρετε το QR Code για να δείτε την πρόοδο του μαθητή.
          </p>
        </div>
      </main>
    </div>
  );
}
