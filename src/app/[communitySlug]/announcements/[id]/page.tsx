import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/rich-text";
import { getCommunity } from "@/lib/communities";
import { asTimeZone, formatDate } from "@/lib/datetime";
import { requireUuid } from "@/lib/form";
import { getPublicAnnouncement } from "@/lib/public-detail";
import { SLUG_RE } from "@/lib/slug";

// Generated on first request, then cached until the community's data changes.
export function generateStaticParams() {
  return [];
}

export default async function AnnouncementPage({
  params,
}: PageProps<"/[communitySlug]/announcements/[id]">) {
  const { communitySlug, id } = await params;
  if (!SLUG_RE.test(communitySlug)) notFound();
  requireUuid(id);

  const community = await getCommunity(communitySlug);
  if (!community) notFound();
  const announcement = await getPublicAnnouncement(community, id);
  if (!announcement) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
      <Link href={`/${community.slug}`} className="w-fit text-sm underline">
        {community.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{announcement.title}</h1>
        <p className="text-neutral-600">
          {formatDate(announcement.publishedAt, asTimeZone(community.timezone))}
        </p>
      </div>
      <RichText doc={announcement.bodyDoc} text={announcement.body} />
    </main>
  );
}
