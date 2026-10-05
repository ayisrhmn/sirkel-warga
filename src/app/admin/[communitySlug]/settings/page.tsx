import { requireMember } from "@/lib/access";
import { DeleteCommunityForm, RenameCommunityForm } from "./settings-forms";

export default async function SettingsPage({
  params,
}: PageProps<"/admin/[communitySlug]/settings">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug, { owner: true });

  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Nama komunitas</h2>
        <RenameCommunityForm slug={community.slug} name={community.name} />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Slug <span className="font-mono">/{community.slug}</span> tidak bisa
          diubah.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
          Hapus komunitas
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Semua data komunitas dan akun admin-nya ikut terhapus. Tidak bisa
          dibatalkan.
        </p>
        <DeleteCommunityForm slug={community.slug} />
      </section>
    </main>
  );
}
