import { DeleteButton } from "@/components/delete-button";
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
    select: { id: true, title: true, body: true, status: true, publishedAt: true },
  });

  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tambah pengumuman</h2>
        <AnnouncementForm slug={community.slug} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Pengumuman ({items.length})</h2>
        {items.length === 0 && (
          <p className="text-neutral-600">Belum ada pengumuman.</p>
        )}
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-neutral-600">
                  {item.status === "public"
                    ? `Publik · ${formatDate(item.publishedAt, asTimeZone(community.timezone))}`
                    : "Draft"}
                </p>
              </div>
              <details>
                <summary className="cursor-pointer underline">Edit</summary>
                <div className="mt-3">
                  <AnnouncementForm
                    slug={community.slug}
                    item={{
                      id: item.id,
                      title: item.title,
                      body: item.body,
                      status: item.status,
                    }}
                  />
                </div>
              </details>
              <DeleteButton
                action={deleteAnnouncement.bind(null, community.slug, item.id)}
                confirmText={`Hapus pengumuman "${item.title}"?`}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
