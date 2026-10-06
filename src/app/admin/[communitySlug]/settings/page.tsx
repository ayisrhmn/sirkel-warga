import { Download } from "lucide-react";
import { buttonClass } from "@/components/atoms/button";
import { Chip } from "@/components/atoms/chip";
import { FormPanel } from "@/components/molecules/form-panel";
import { PageHeader } from "@/components/molecules/page-header";
import { requireMember } from "@/lib/access";
import { asTimeZone } from "@/lib/datetime";
import { DEFAULT_PRIMARY } from "@/lib/theme";
import { hasProtectedPassword } from "@/lib/queries/communities";
import {
  ColorForm,
  DeleteCommunityForm,
  ProtectedPasswordForm,
  RenameCommunityForm,
  TimezoneForm,
} from "./settings-forms";

const note = "text-[15px] leading-relaxed text-muted";

export default async function SettingsPage({
  params,
}: PageProps<"/admin/[communitySlug]/settings">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug, { owner: true });
  const hasPassword = await hasProtectedPassword(community.id);

  return (
    <>
      <PageHeader title="Pengaturan" description="Info komunitas, password laporan, cadangan, dan penghapusan." />
      <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
        <FormPanel title="Nama komunitas">
          <RenameCommunityForm slug={community.slug} name={community.name} />
          <p className={note}>
            Slug <span className="font-mono">/{community.slug}</span> tidak bisa diubah.
          </p>
        </FormPanel>
        <FormPanel title="Warna komunitas">
          <p className={note}>
            Warna ini dipakai di halaman komunitas untuk warga dan di panel admin ini, supaya komunitasmu mudah dikenali.
            Warna yang terang membuat teks putih di tombol sulit dibaca, jadi pilih yang cukup gelap kalau bisa.
          </p>
          <ColorForm slug={community.slug} color={community.primaryColor ?? DEFAULT_PRIMARY} />
        </FormPanel>
        <FormPanel title="Zona waktu">
          <p className={note}>
            Jam agenda diisi dan ditampilkan dalam zona ini. Mengubahnya hanya
            mengubah tampilan jam, bukan waktu kejadian agenda yang sudah ada.
          </p>
          <TimezoneForm slug={community.slug} timezone={asTimeZone(community.timezone)} />
        </FormPanel>
        <FormPanel title="Password laporan dilindungi">
          <div>
            {hasPassword ? <Chip tone="green">Sudah diatur</Chip> : <Chip tone="amber">Belum diatur</Chip>}
          </div>
          <p className={note}>
            {hasPassword
              ? "Isi di bawah untuk menggantinya. "
              : "Laporan berstatus Dilindungi belum bisa dibuka siapa pun. "}
            Bagikan password ini hanya ke warga yang berhak, mis. lewat grup
            WhatsApp RT.
          </p>
          <ProtectedPasswordForm slug={community.slug} />
        </FormPanel>
        <FormPanel title="Cadangan">
          <p className={note}>
            Berisi pengumuman, agenda, kontak, dan semua laporan (termasuk yang
            dilindungi). Password dan akun tidak ikut. Simpan di tempat yang
            aman, bukan di grup chat. Bisa dipulihkan lewat halaman Buat
            komunitas.
          </p>
          <a href={`/admin/${community.slug}/backup`} className={buttonClass({ variant: "secondary" }, "self-start")}>
            <Download aria-hidden="true" size={20} />
            Unduh cadangan lengkap (JSON)
          </a>
        </FormPanel>
        <div className="lg:col-span-2">
          <FormPanel title="Hapus komunitas" tone="danger">
            <p className={note}>
              Semua data komunitas dan akun admin-nya ikut terhapus. Tidak bisa
              dibatalkan dari sini. <strong>Unduh cadangan lengkap di atas dulu</strong>:
              itu satu-satunya cara memulihkannya.
            </p>
            <DeleteCommunityForm slug={community.slug} />
          </FormPanel>
        </div>
      </div>
    </>
  );
}
