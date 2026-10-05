import { notFound } from "next/navigation";
import { getCommunity } from "@/lib/communities";
import { SLUG_RE } from "@/lib/slug";

// Empty list: no page at build time, each community page is generated on the
// first request and then cached until revalidated (ISR).
export function generateStaticParams() {
  return [];
}

export default async function CommunityPage({
  params,
}: PageProps<"/[communitySlug]">) {
  const { communitySlug } = await params;
  if (!SLUG_RE.test(communitySlug)) notFound();

  const community = await getCommunity(communitySlug);
  if (!community) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{community.name}</h1>
    </main>
  );
}
