import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CreateCommunityForm } from "./create-community-form";
import { RestoreForm } from "./restore-form";

export default async function CreateCommunityPage() {
  const user = await requireUser();
  // Each account belongs to one community: created admins to the one that
  // made them, everyone else to the one they create here.
  const memberships = await getDb().membership.count({
    where: { userId: user.id },
  });
  if (memberships > 0) redirect("/admin");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Buat komunitas</h1>
      <CreateCommunityForm />
      <section className="flex flex-col gap-3 border-t border-neutral-300 pt-6 dark:border-neutral-700">
        <h2 className="text-lg font-bold">Atau pulihkan dari cadangan</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Untuk komunitas yang terhapus. Isinya (pengumuman, agenda, kontak,
          laporan) kembali, tapi password laporan dilindungi dan akun admin
          perlu dibuat ulang.
        </p>
        <RestoreForm />
      </section>
    </main>
  );
}
