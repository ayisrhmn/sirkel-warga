import { getDb } from "@/lib/db";

export const listMembers = (communityId: string) =>
  getDb().membership.findMany({
    where: { communityId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { role: true, user: { select: { id: true, name: true, username: true } } },
  });

export const listCommunitiesOfUser = (userId: string) =>
  getDb().membership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { community: { select: { slug: true, name: true } } },
  });

export const countCommunitiesOfUser = (userId: string) => getDb().membership.count({ where: { userId } });

// Accounts that registered and wait for the platform admin's approval.
export const listPendingUsers = () =>
  getDb().user.findMany({
    where: { approved: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, username: true, createdAt: true },
  });
