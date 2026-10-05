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

export async function clearRateLimit(key: string) {
  await getDb().rateLimit.deleteMany({ where: { key } });
}

// The visitor's address as set by the platform (Vercel overwrites this header).
export async function clientIp() {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "local";
}
