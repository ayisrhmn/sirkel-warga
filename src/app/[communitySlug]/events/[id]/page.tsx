import { CalendarDays, Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Chip } from "@/components/atoms/chip";
import { Heading } from "@/components/atoms/heading";
import { Card } from "@/components/atoms/card";
import { IconTile } from "@/components/atoms/icon-tile";
import { RichText } from "@/components/organisms/rich-text";
import { PublicPage } from "@/components/templates/public-page";
import { getCommunity } from "@/lib/communities";
import { asTimeZone, formatDate, formatTime } from "@/lib/datetime";
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

  const zone = asTimeZone(community.timezone);
  const facts = [
    { icon: CalendarDays, label: "Tanggal", value: formatDate(event.startsAt, zone) },
    { icon: Clock, label: "Jam", value: formatTime(event.startsAt, zone) },
    ...(event.location ? [{ icon: MapPin, label: "Lokasi", value: event.location }] : []),
  ];

  return (
    <PublicPage themeColor={community.primaryColor} back={{ href: `/${community.slug}`, label: community.name }}>
      <div>
        <Chip tone="amber" icon={CalendarDays}>
          Agenda
        </Chip>
      </div>
      <Heading as="h1" size="hero" className="text-4xl sm:text-5xl">
        {event.title}
      </Heading>
      <Card className="flex flex-wrap gap-x-10 gap-y-5">
        {facts.map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-3.5">
            <IconTile icon={icon} tone="amber" size="lg" shape="circle" />
            <div>
              <p className="text-sm font-semibold text-muted">{label}</p>
              <p className="text-lg font-bold text-ink">{value}</p>
            </div>
          </div>
        ))}
      </Card>
      {(event.description || event.descriptionDoc) && (
        <Card padding="lg">
          <RichText doc={event.descriptionDoc} text={event.description} />
        </Card>
      )}
    </PublicPage>
  );
}
