import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

const communitySelect = { id: true, slug: true, name: true, timezone: true } as const;

// The single gate for community admin pages and Server Actions: the signed-in
// user must be a member of this community (and its owner when `owner` is set).
// Anyone else gets a 404, so other communities' existence is not revealed.
// Always use the returned `community.id` for queries, never an id from input.
//
// The one exception is a platform admin (the operator of the whole service):
// for a community they do not belong to they get "forced" access with the
// rights of a super admin, so they can step in when needed. `forced` is true
// then, and the admin pages say so. Platform admins never create communities
// themselves (see the create/restore actions), so they have no memberships of
// their own to fall back on.
export async function requireMember(
  slug: string,
  { owner = false }: { owner?: boolean } = {},
) {
  const user = await requireUser();
  const db = getDb();

  const membership = await db.membership.findFirst({
    where: { userId: user.id, community: { slug } },
    select: { role: true, community: { select: communitySelect } },
  });
  if (membership) {
    if (owner && membership.role !== "owner") notFound();
    return { user, community: membership.community, role: membership.role, forced: false };
  }

  if (user.isPlatformAdmin) {
    const community = await db.community.findUnique({ where: { slug }, select: communitySelect });
    if (!community) notFound();
    return { user, community, role: "owner" as const, forced: true };
  }
  notFound();
}
