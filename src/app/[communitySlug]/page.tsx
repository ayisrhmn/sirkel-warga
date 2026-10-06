import { CalendarDays, Megaphone, Table2 } from "lucide-react";
import { Container } from "@/components/atoms/container";
import { ThemeScope } from "@/components/atoms/theme-scope";
import { WhatsAppIcon } from "@/components/atoms/whatsapp-icon";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageSection } from "@/components/molecules/page-section";
import { AnnouncementCard } from "@/components/organisms/announcement-card";
import { CommunityHero } from "@/components/organisms/community-hero";
import { ContactCard } from "@/components/organisms/contact-card";
import { EventCard } from "@/components/organisms/event-card";
import { ReportCard } from "@/components/organisms/report-card";
import { SiteFooter } from "@/components/organisms/site-footer";
import { CommunityNotFound } from "@/components/templates/community-not-found";
import { getCommunity } from "@/lib/communities";
import { asTimeZone, calendarTile, formatDate, formatTime } from "@/lib/datetime";
import { whatsappUrl } from "@/lib/phone";
import { getPublicContent } from "@/lib/public-content";
import { SLUG_RE } from "@/lib/slug";

// Empty list: no page at build time, each community page is generated on the
// first request and then cached until revalidated (ISR). The hourly window
// also drops events that have passed.
export function generateStaticParams() {
  return [];
}
export const revalidate = 3600;

export default async function CommunityPage({
  params,
}: PageProps<"/[communitySlug]">) {
  const { communitySlug: requested } = await params;
  // Links typed by hand often have capitals ("RT05-Melati"). The page cache
  // ignores letter case in paths, so serve the same page instead of
  // redirecting (a cached redirect would loop back to itself).
  const communitySlug = requested.toLowerCase();
  if (!SLUG_RE.test(communitySlug)) return <CommunityNotFound />;

  const community = await getCommunity(communitySlug);
  if (!community) return <CommunityNotFound />;

  const { announcements, events, contacts, datasets } = await getPublicContent(community);
  const zone = asTimeZone(community.timezone);
  const base = `/${community.slug}`;
  const sections = [
    { id: "pengumuman", label: "Pengumuman", icon: Megaphone },
    { id: "agenda", label: "Agenda", icon: CalendarDays },
    ...(datasets.length > 0 ? [{ id: "laporan", label: "Laporan", icon: Table2 }] : []),
    { id: "kontak", label: "Kontak", icon: WhatsAppIcon },
  ];

  return (
    <ThemeScope color={community.primaryColor}>
      <CommunityHero name={community.name} sections={sections} />
      <Container className="py-8 lg:py-12">
        <main className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="flex flex-col gap-12">
            <PageSection id="pengumuman" icon={Megaphone} title="Pengumuman">
              {announcements.length === 0 && <EmptyState>Belum ada pengumuman.</EmptyState>}
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} href={`${base}/announcements/${a.id}`} title={a.title} date={formatDate(a.publishedAt, zone)} excerpt={a.excerpt} />
              ))}
            </PageSection>
            <PageSection id="agenda" icon={CalendarDays} tone="amber" title="Agenda">
              {events.length === 0 && <EmptyState>Belum ada agenda.</EmptyState>}
              {events.map((e) => (
                <EventCard
                  key={e.id}
                  href={`${base}/events/${e.id}`}
                  title={e.title}
                  tile={calendarTile(e.startsAt, zone)}
                  time={formatTime(e.startsAt, zone)}
                  location={e.location}
                  excerpt={e.excerpt}
                />
              ))}
            </PageSection>
          </div>
          <div className="flex flex-col gap-12">
            {datasets.length > 0 && (
              <PageSection id="laporan" icon={Table2} title="Laporan">
                {datasets.map((d) => (
                  <ReportCard
                    key={d.id}
                    href={`${base}/${d.visibility === "protected" ? "protected" : "datasets"}/${d.id}`}
                    title={d.title}
                    period={d.period}
                    locked={d.visibility === "protected"}
                  />
                ))}
              </PageSection>
            )}
            <PageSection id="kontak" icon={WhatsAppIcon} tone="amber" title="Kontak penting">
              {contacts.length === 0 && <EmptyState>Belum ada kontak.</EmptyState>}
              {contacts.map((c) => (
                <ContactCard key={c.id} name={c.name} role={c.role} phone={c.phone} whatsappHref={whatsappUrl(c.phone)} />
              ))}
            </PageSection>
          </div>
        </main>
      </Container>
      <SiteFooter />
    </ThemeScope>
  );
}
