import Link from "next/link";
import { requireMember } from "@/lib/access";
import { getDb } from "@/lib/db";

export default async function CommunityAdminPage({
  params,
}: PageProps<"/admin/[communitySlug]">) {
  const { communitySlug } = await params;
  const { community, role } = await requireMember(communitySlug);

  const where = { communityId: community.id };
  const db = getDb();
  const [announcements, drafts, events, contacts, datasets] = await Promise.all([
    db.announcement.count({ where: { ...where, status: "public" } }),
    db.announcement.count({ where: { ...where, status: "draft" } }),
    db.event.count({ where }),
    db.contact.count({ where }),
    db.dataset.count({ where }),
  ]);
  const base = `/admin/${community.slug}`;

  return (
    <main className="flex flex-col gap-4">
      <p>
        Link untuk dibagikan ke warga:{" "}
        <span className="font-mono">/{community.slug}</span>
      </p>
      <ul className="flex flex-col gap-1">
        <li>
          <Link href={`${base}/announcements`} className="underline">
            Pengumuman
          </Link>
          : {announcements} publik, {drafts} draft
        </li>
        <li>
          <Link href={`${base}/events`} className="underline">
            Agenda
          </Link>
          : {events}
        </li>
        <li>
          <Link href={`${base}/contacts`} className="underline">
            Kontak
          </Link>
          : {contacts}
        </li>
        <li>
          <Link href={`${base}/datasets`} className="underline">
            Laporan
          </Link>
          : {datasets}
        </li>
      </ul>
      {role === "owner" && (
        <p className="text-sm">
          <a href={`${base}/backup`} className="underline">
            Unduh cadangan lengkap
          </a>{" "}
          <span className="text-neutral-600">
            sebelum perubahan besar dan secara berkala.
          </span>
        </p>
      )}
    </main>
  );
}
