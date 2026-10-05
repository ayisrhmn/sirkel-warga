import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/rich-text";
import { getCommunity } from "@/lib/communities";
import { asTimeZone, formatDateTime } from "@/lib/datetime";
import { requireUuid } from "@/lib/form";
import { getPublicEvent } from "@/lib/public-detail";
import { SLUG_RE } from "@/lib/slug";

// Generated on first request, then cached until the community's data changes.
export function generateStaticParams() {
  return [];
}

export default async function EventPage({
  params,
}: PageProps<"/[communitySlug]/events/[id]">) {
  const { communitySlug, id } = await params;
  if (!SLUG_RE.test(communitySlug)) notFound();
  requireUuid(id);

  const community = await getCommunity(communitySlug);
  if (!community) notFound();
  const event = await getPublicEvent(community, id);
  if (!event) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
      <Link href={`/${community.slug}`} className="w-fit text-sm underline">
        {community.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-neutral-600">
          {formatDateTime(event.startsAt, asTimeZone(community.timezone))}
        </p>
        {event.location && <p>{event.location}</p>}
      </div>
      {(event.description || event.descriptionDoc) && (
        <RichText doc={event.descriptionDoc} text={event.description} />
      )}
    </main>
  );
}
