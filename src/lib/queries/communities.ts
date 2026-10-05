import { getDb } from "@/lib/db";

// Whether the community has set the password that opens protected reports.
// Only the fact is returned; the hash never leaves the server layer.
export async function hasProtectedPassword(communityId: string) {
  const { protectedPasswordHash } = await getDb().community.findUniqueOrThrow({
    where: { id: communityId },
    select: { protectedPasswordHash: true },
  });
  return protectedPasswordHash !== null;
}

// Every community with its members, for the platform admin.
export const listCommunitiesWithMembers = () =>
  getDb().community.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      createdAt: true,
      memberships: { select: { role: true, user: { select: { name: true, username: true } } } },
    },
  });
