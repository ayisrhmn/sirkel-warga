import { headers } from "next/headers";
import { getDb } from "@/lib/db";

// Fixed-window counter in the shared `rateLimit` table (also used by Better
// Auth, which never uses keys with our prefix). One atomic statement, so
// parallel requests cannot slip extra attempts through. Returns true when the
// attempt is allowed. The id is random so that `key` is the only constraint a
// concurrent insert can collide on, which ON CONFLICT handles.
export async function hitRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const rows = await getDb().$queryRaw<{ count: number }[]>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (gen_random_uuid()::text, ${key}, 1, ${now}::bigint)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rateLimit"."lastRequest" < ${windowStart}::bigint
                     THEN 1 ELSE "rateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN "rateLimit"."lastRequest" < ${windowStart}::bigint
                           THEN ${now}::bigint ELSE "rateLimit"."lastRequest" END
    RETURNING "count"
  `;
  return Number(rows[0].count) <= max;
}

// Gives one attempt back (a counter that should only count failures).
export async function releaseRateLimit(key: string) {
  await getDb().$executeRaw`
    UPDATE "rateLimit" SET "count" = GREATEST("count" - 1, 0) WHERE "key" = ${key}
  `;
}

const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // every window we use is at most an hour

// Removes counters whose window ended long ago, so the table stays small.
// Better Auth writes to the same table and never cleans it.
export async function pruneRateLimits() {
  const { count } = await getDb().rateLimit.deleteMany({
    where: { lastRequest: { lt: BigInt(Date.now() - STALE_AFTER_MS) } },
  });
  return count;
}

// Cheap enough to run now and then instead of on a schedule (Vercel's free
// plan has no frequent cron): about one request in fifty does the cleanup.
export async function pruneRateLimitsSometimes(chance = 0.02) {
  if (Math.random() < chance) await pruneRateLimits();
}

export async function clearRateLimit(key: string) {
  await getDb().rateLimit.deleteMany({ where: { key } });
}

// The visitor's address as set by the platform (Vercel overwrites this header).
export async function clientIp() {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "local";
}
