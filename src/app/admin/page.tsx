import Link from "next/link";
import { requireUser } from "@/lib/session";
import { LogoutButton } from "./logout-button";

export default async function AdminPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Halo, {user.name}</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Belum ada komunitas.
      </p>
      {user.isPlatformAdmin && (
        <Link href="/platform" className="underline">
          Persetujuan akun
        </Link>
      )}
      <LogoutButton />
    </main>
  );
}
