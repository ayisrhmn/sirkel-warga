import { DeleteButton } from "@/components/molecules/delete-button";
import { EditDisclosure } from "@/components/molecules/edit-disclosure";
import { EmptyState } from "@/components/molecules/empty-state";
import { FormPanel } from "@/components/molecules/form-panel";
import { PageHeader } from "@/components/molecules/page-header";
import { StatusChip } from "@/components/molecules/status-chip";
import { Heading } from "@/components/atoms/heading";
import { AdminListItem } from "@/components/organisms/admin-list-item";
import { AdminSplit } from "@/components/templates/admin-split";
import { requireMember } from "@/lib/access";
import { asTimeZone, formatDate } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import { deleteAnnouncement } from "./actions";
import { AnnouncementForm } from "./announcement-form";

export default async function AnnouncementsPage({
  params,
}: PageProps<"/admin/[communitySlug]/announcements">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);

  const items = await getDb().announcement.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, bodyDoc: true, status: true, publishedAt: true },
  });

  return (
    <>
      <PageHeader title="Pengumuman" description="Kabar untuk warga. Yang berstatus publik langsung tampil di halaman komunitas." />
      <AdminSplit
        form={
          <FormPanel title="Tambah pengumuman">
            <AnnouncementForm slug={community.slug} />
          </FormPanel>
        }
        list={
          <>
            <Heading>Pengumuman ({items.length})</Heading>
            {items.length === 0 && <EmptyState>Belum ada pengumuman.</EmptyState>}
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <AdminListItem
                  key={item.id}
                  title={item.title}
                  meta={
                    <>
                      <StatusChip status={item.status} />
                      {item.status === "public" && <span>{formatDate(item.publishedAt, asTimeZone(community.timezone))}</span>}
                    </>
                  }
                  action={
                    <DeleteButton
                      action={deleteAnnouncement.bind(null, community.slug, item.id)}
                      confirmText={`Hapus pengumuman "${item.title}"?`}
                    />
                  }
                >
                  <EditDisclosure summary="Edit">
                    <AnnouncementForm
                      slug={community.slug}
                      item={{
                        id: item.id,
                        title: item.title,
                        body: item.body,
                        bodyDoc: item.bodyDoc ? JSON.stringify(item.bodyDoc) : "",
                        status: item.status,
                      }}
                    />
                  </EditDisclosure>
                </AdminListItem>
              ))}
            </ul>
          </>
        }
      />
    </>
  );
}
