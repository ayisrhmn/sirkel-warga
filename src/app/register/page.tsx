import Link from "next/link";
import { RegisterForm } from "./register-form";

// Reads REGISTRATION_CODE at request time, so the form matches the server.
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Daftar pengurus</h1>
      <RegisterForm requireCode={Boolean(process.env.REGISTRATION_CODE)} />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
