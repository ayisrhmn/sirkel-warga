import { cookies } from "next/headers";
import type { DatasetCell, DatasetFill } from "@/lib/dataset";
import { getDb } from "@/lib/db";
import { accessCookieName, verifyAccessToken } from "@/lib/protected-access";
import { getSession } from "@/lib/session";

export type ProtectedDatasetResult =
  | { state: "not-found" }
  | { state: "public" } // not protected (any more): use the public page
  | {
      state: "locked";
      communityName: string;
      primaryColor: string | null;
      title: string;
      period: string | null;
      hasPassword: boolean;
    }
  | {
      state: "open";
      communityName: string;
      primaryColor: string | null;
      title: string;
      period: string | null;
      columns: string[];
      rows: DatasetCell[][];
      fills: DatasetFill[];
    };

// The only place where the rows of a `protected` dataset leave the database
// for a visitor, and only after the access cookie checks out. Never cached:
// it reads the request's cookies, so callers are dynamic.
export async function getProtectedDataset(
  communitySlug: string,
  id: string,
): Promise<ProtectedDatasetResult> {
  const db = getDb();
  const community = await db.community.findUnique({
    where: { slug: communitySlug },
    select: { id: true, name: true, primaryColor: true, protectedPasswordHash: true },
  });
  if (!community) return { state: "not-found" };

  // Metadata first: no rows are loaded until access has been verified.
  const meta = await db.dataset.findFirst({
    where: { id, communityId: community.id },
    select: { title: true, period: true, visibility: true },
  });
  if (!meta || meta.visibility === "draft") return { state: "not-found" };
  if (meta.visibility === "public") return { state: "public" };

  const hash = community.protectedPasswordHash;
  const base = { communityName: community.name, primaryColor: community.primaryColor, title: meta.title, period: meta.period };

  // Members of this community and platform admins read it without the password.
  // Everyone else, signed in or not, needs it every time.
  const open = async (): Promise<ProtectedDatasetResult> => {
    const data = await db.dataset.findFirstOrThrow({
      where: { id, communityId: community.id, visibility: "protected" },
      select: { columns: true, rows: true, fills: true },
    });
    return {
      state: "open",
      ...base,
      columns: data.columns as string[],
      rows: data.rows as DatasetCell[][],
      fills: data.fills as DatasetFill[],
    };
  };
  const user = (await getSession())?.user;
  if (user?.approved) {
    if (user.isPlatformAdmin) return open();
    const member = await db.membership.findFirst({
      where: { userId: user.id, communityId: community.id },
      select: { id: true },
    });
    if (member) return open();
  }

  const token = (await cookies()).get(accessCookieName(community.id))?.value;
  if (!hash || !token || !verifyAccessToken(token, community.id, hash))
    return { state: "locked", ...base, hasPassword: hash !== null };

  return open();
}
