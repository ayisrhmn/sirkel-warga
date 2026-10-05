import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-4xl font-bold">Sirkel</h1>
        <p className="mt-2 text-xl font-medium">Info lingkungan, satu link.</p>
        <p className="mt-6">
          Tempat warga lihat pengumuman, agenda, kontak penting, dan laporan
          lingkungan.
        </p>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          Buka lewat link yang dibagikan pengurus RT-mu. Belum punya link? Tanya
          pengurus lingkunganmu.
        </p>
      </main>
      <footer className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/login" prefetch={false} className="underline">
          Login pengurus
        </Link>
        <span>Dibuat sukarela untuk warga.</span>
      </footer>
    </>
  );
}
