import Link from "next/link";
import { DaftarForm } from "./daftar-form";

export default function DaftarPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Daftar pengurus</h1>
      <DaftarForm />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
