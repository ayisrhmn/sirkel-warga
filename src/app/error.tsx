"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/form-styles";

// Shown instead of a raw error when something unexpected fails (for example
// the database is waking up). The details only go to the server log.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Halaman gagal dimuat. Coba lagi sebentar. Kalau masih gagal, hubungi
        pengurus.
      </p>
      <button onClick={() => retry()} className={`${buttonClass} mx-auto max-w-48`}>
        Coba lagi
      </button>
    </main>
  );
}
