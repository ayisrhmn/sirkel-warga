import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { CommunityNotFound } from "@/components/community-not-found";
import { getCommunity } from "@/lib/communities";
import { asTimeZone, formatDate, formatDateTime } from "@/lib/datetime";
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
  const muted = "text-neutral-600";
  const card = "rounded-md border border-neutral-300 p-3";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-bold">{community.name}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Pengumuman</h2>
        {announcements.length === 0 && <p className={muted}>Belum ada pengumuman.</p>}
        {announcements.map((a) => (
          <article key={a.id} className={card}>
            <h3 className="font-medium">{a.title}</h3>
            <p className={`text-sm ${muted}`}>{formatDate(a.publishedAt, zone)}</p>
            <p className="mt-2 whitespace-pre-line">{a.body}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Agenda</h2>
        {events.length === 0 && <p className={muted}>Belum ada agenda.</p>}
        {events.map((e) => (
          <article key={e.id} className={card}>
            <h3 className="font-medium">{e.title}</h3>
            <p className={`text-sm ${muted}`}>{formatDateTime(e.startsAt, zone)}</p>
            {e.location && <p className="text-sm">{e.location}</p>}
            {e.description && (
              <p className="mt-2 whitespace-pre-line">{e.description}</p>
            )}
          </article>
        ))}
      </section>

      {datasets.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Laporan</h2>
          {datasets.map((d) => (
            <Link
              key={d.id}
              href={`/${community.slug}/${d.visibility === "protected" ? "protected" : "datasets"}/${d.id}`}
              className={`${card} flex items-center justify-between gap-3 underline`}
            >
              <span>
                {d.title}
                {d.period && <span className={`block text-sm no-underline ${muted}`}>{d.period}</span>}
              </span>
              {d.visibility === "protected" && (
                <span className={`text-sm no-underline ${muted}`}>Dilindungi</span>
              )}
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Kontak penting</h2>
        {contacts.length === 0 && <p className={muted}>Belum ada kontak.</p>}
        {contacts.map((c) => (
          <article key={c.id} className={`${card} flex items-center justify-between gap-3`}>
            <div>
              <h3 className="font-medium">{c.name}</h3>
              <p className={`text-sm ${muted}`}>{c.role}</p>
            </div>
            <a
              href={whatsappUrl(c.phone)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat WhatsApp ${c.name}, ${c.phone}`}
              className="flex shrink-0 items-center gap-2 rounded-md border border-neutral-300 px-3 py-2"
            >
              <MessageCircle aria-hidden="true" size={18} />
              {c.phone}
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
