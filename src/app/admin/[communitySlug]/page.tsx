import { Archive, CalendarDays, ExternalLink, Megaphone, Plus, Table2, Upload } from "lucide-react";
import { ButtonLink, buttonClass } from "@/components/atoms/button";
import { WhatsAppIcon } from "@/components/atoms/whatsapp-icon";
import { FormPanel } from "@/components/molecules/form-panel";
import { PageHeader } from "@/components/molecules/page-header";
import { StatTile } from "@/components/molecules/stat-tile";
import { ShareLinkCard } from "@/components/organisms/share-link-card";
import { requireMember } from "@/lib/access";
import { getContentCounts } from "@/lib/queries/content";

export default async function CommunityAdminPage({
  params,
}: PageProps<"/admin/[communitySlug]">) {
  const { communitySlug } = await params;
  const { user, community, role } = await requireMember(communitySlug);

  const { announcements, drafts, events, contacts, datasets } = await getContentCounts(community.id);
  const base = `/admin/${community.slug}`;

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name}`}
        description={community.name}
        action={
          <ButtonLink href={`/${community.slug}`} variant="secondary" size="sm" icon={ExternalLink}>
            Lihat halaman publik
          </ButtonLink>
        }
      />
      <ShareLinkCard slug={community.slug} />
      <div className="flex flex-wrap gap-4">
        <StatTile href={`${base}/announcements`} icon={Megaphone} tone="green" value={announcements} label="Pengumuman publik" note={`${drafts} draft`} />
        <StatTile href={`${base}/events`} icon={CalendarDays} tone="amber" value={events} label="Agenda" />
        <StatTile href={`${base}/contacts`} icon={WhatsAppIcon} tone="green" value={contacts} label="Kontak penting" />
        <StatTile href={`${base}/datasets`} icon={Table2} tone="amber" value={datasets} label="Laporan" />
      </div>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <FormPanel title="Tambah cepat">
          <div className="flex flex-col gap-2.5">
            <ButtonLink href={`${base}/announcements`} variant="secondary" icon={Plus} align="start">
              Tulis pengumuman
            </ButtonLink>
            <ButtonLink href={`${base}/events`} variant="secondary" icon={Plus} align="start">
              Tambah agenda
            </ButtonLink>
            <ButtonLink href={`${base}/datasets/import`} variant="secondary" icon={Upload} align="start">
              Impor laporan dari Excel
            </ButtonLink>
          </div>
        </FormPanel>
        {role === "owner" && (
          <FormPanel title="Cadangan lengkap">
            <p className="text-[15px] text-muted">Unduh sebelum perubahan besar dan secara berkala.</p>
            <a href={`${base}/backup`} className={buttonClass({ variant: "secondary" }, "self-start")}>
              <Archive aria-hidden="true" size={20} />
              Unduh cadangan lengkap
            </a>
          </FormPanel>
        )}
      </div>
    </>
  );
}
