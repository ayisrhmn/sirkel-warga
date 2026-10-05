import { cookies } from "next/headers";
import type { DatasetCell } from "@/lib/dataset";
import { getDb } from "@/lib/db";
import { accessCookieName, verifyAccessToken } from "@/lib/protected-access";

export type ProtectedDatasetResult =
  | { state: "not-found" }
  | { state: "public" } // not protected (any more): use the public page
  | {
      state: "locked";
      communityName: string;
      title: string;
      period: string | null;
      hasPassword: boolean;
    }
  | {
      state: "open";
      communityName: string;
      title: string;
      period: string | null;
      columns: string[];
      rows: DatasetCell[][];
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
    select: { id: true, name: true, protectedPasswordHash: true },
  });
  if (!community) return { state: "not-found" };

  // Metadata first: no rows are loaded until the cookie has been verified.
  const meta = await db.dataset.findFirst({
    where: { id, communityId: community.id },
    select: { title: true, period: true, visibility: true },
  });
  if (!meta || meta.visibility === "draft") return { state: "not-found" };
  if (meta.visibility === "public") return { state: "public" };

  const hash = community.protectedPasswordHash;
  const token = (await cookies()).get(accessCookieName(community.id))?.value;
  const base = { communityName: community.name, title: meta.title, period: meta.period };

  if (!hash || !token || !verifyAccessToken(token, community.id, hash))
    return { state: "locked", ...base, hasPassword: hash !== null };

  const data = await db.dataset.findFirstOrThrow({
    where: { id, communityId: community.id, visibility: "protected" },
    select: { columns: true, rows: true },
  });
  return {
    state: "open",
    ...base,
    columns: data.columns as string[],
    rows: data.rows as DatasetCell[][],
  };
}
