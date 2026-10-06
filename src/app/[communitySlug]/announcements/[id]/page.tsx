import { CalendarDays, Megaphone } from "lucide-react";
import { notFound } from "next/navigation";
import { Chip } from "@/components/atoms/chip";
import { Heading } from "@/components/atoms/heading";
import { Card } from "@/components/atoms/card";
import { MetaItem } from "@/components/molecules/meta-item";
import { RichText } from "@/components/organisms/rich-text";
import { PublicPage } from "@/components/templates/public-page";
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
    <PublicPage themeColor={community.primaryColor} back={{ href: `/${community.slug}`, label: community.name }}>
      <div>
        <Chip tone="green" icon={Megaphone}>
          Pengumuman
        </Chip>
      </div>
      <Heading as="h1" size="hero" className="text-4xl sm:text-5xl">
        {announcement.title}
      </Heading>
      <MetaItem icon={CalendarDays}>{formatDate(announcement.publishedAt, asTimeZone(community.timezone))}</MetaItem>
      <Card padding="lg" className="mt-2">
        <RichText doc={announcement.bodyDoc} text={announcement.body} />
      </Card>
    </PublicPage>
  );
}
