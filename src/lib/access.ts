import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

// The single gate for community admin pages and Server Actions: the signed-in
// user must be a member of this community (and its owner when `owner` is set).
// Anyone else gets a 404, so other communities' existence is not revealed.
// Always use the returned `community.id` for queries, never an id from input.
export async function requireMember(
  slug: string,
  { owner = false }: { owner?: boolean } = {},
) {
  const user = await requireUser();
  const membership = await getDb().membership.findFirst({
    where: { userId: user.id, community: { slug } },
    select: {
      role: true,
      community: { select: { id: true, slug: true, name: true, timezone: true } },
    },
  });
  if (!membership || (owner && membership.role !== "owner")) notFound();
  return { user, community: membership.community, role: membership.role };
}
