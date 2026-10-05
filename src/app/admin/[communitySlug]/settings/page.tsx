import { requireMember } from "@/lib/access";
import { asTimeZone } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import {
  DeleteCommunityForm,
  ProtectedPasswordForm,
  RenameCommunityForm,
  TimezoneForm,
} from "./settings-forms";

export default async function SettingsPage({
  params,
}: PageProps<"/admin/[communitySlug]/settings">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug, { owner: true });
  const { protectedPasswordHash } = await getDb().community.findUniqueOrThrow({
    where: { id: community.id },
    select: { protectedPasswordHash: true },
  });

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
        <h2 className="text-lg font-bold">Zona waktu</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Jam agenda diisi dan ditampilkan dalam zona ini. Mengubahnya hanya
          mengubah tampilan jam, bukan waktu kejadian agenda yang sudah ada.
        </p>
        <TimezoneForm slug={community.slug} timezone={asTimeZone(community.timezone)} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Password laporan dilindungi</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {protectedPasswordHash
            ? "Password sudah diatur. Isi di bawah untuk menggantinya."
            : "Belum diatur: laporan berstatus Dilindungi belum bisa dibuka siapa pun."}{" "}
          Bagikan password ini hanya ke warga yang berhak, mis. lewat grup
          WhatsApp RT.
        </p>
        <ProtectedPasswordForm slug={community.slug} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Cadangan</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Berisi pengumuman, agenda, kontak, dan semua laporan (termasuk yang
          dilindungi). Password dan akun tidak ikut. Simpan di tempat yang
          aman, bukan di grup chat. Bisa dipulihkan lewat halaman Buat
          komunitas.
        </p>
        <a href={`/admin/${community.slug}/backup`} className="w-fit underline">
          Unduh cadangan lengkap (JSON)
        </a>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
          Hapus komunitas
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Semua data komunitas dan akun admin-nya ikut terhapus. Tidak bisa
          dibatalkan dari sini. <strong>Unduh cadangan lengkap di atas dulu</strong>:
          itu satu-satunya cara memulihkannya.
        </p>
        <DeleteCommunityForm slug={community.slug} />
      </section>
    </main>
  );
}
