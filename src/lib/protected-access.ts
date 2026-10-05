import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Proof that a visitor entered the community's password for `protected`
// datasets: a signed token in an httpOnly cookie, valid for 7 days.
export const ACCESS_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// One cookie per community, so unlocking A never opens B.
export const accessCookieName = (communityId: string) => `sirkel_access_${communityId}`;

function secret() {
  const value = process.env.COOKIE_SECRET;
  if (!value || value.length < 16)
    throw new Error("COOKIE_SECRET is not set (at least 16 characters).");
  return value;
}

const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

// Tied to the current password hash: changing the password invalidates every
// token issued before.
const fingerprint = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);

export function createAccessToken(
  communityId: string,
  passwordHash: string,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({
      c: communityId,
      f: fingerprint(passwordHash),
      e: now + ACCESS_MAX_AGE_SECONDS * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAccessToken(
  token: string,
  communityId: string,
  passwordHash: string,
  now = Date.now(),
): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const { c, f, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return c === communityId && f === fingerprint(passwordHash) && typeof e === "number" && e > now;
  } catch {
    return false;
  }
}
