import { beforeAll, describe, expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "./password";
import { accessCookieName, createAccessToken, verifyAccessToken } from "./protected-access";

beforeAll(() => {
  process.env.COOKIE_SECRET = "test-secret-with-enough-length-1234";
});

describe("password hashing", () => {
  test("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("rahasia-rt");
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(hash).not.toContain("rahasia-rt");
    expect(await verifyPassword("rahasia-rt", hash)).toBe(true);
    expect(await verifyPassword("Rahasia-rt", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  test("every hash has its own salt", async () => {
    expect(await hashPassword("sama")).not.toBe(await hashPassword("sama"));
  });

  test("malformed stored values never verify", async () => {
    for (const stored of ["", "plaintext", "scrypt$1$2$3", "bcrypt$a$b$c$d$e"]) {
      expect(await verifyPassword("x", stored)).toBe(false);
    }
  });
});

describe("access token", () => {
  const community = "c0000000-0000-4000-8000-000000000001";
  const other = "c0000000-0000-4000-8000-000000000002";
  const hash = "scrypt$16384$8$1$salt$hash";

  test("a fresh token verifies only for its community and password", () => {
    const token = createAccessToken(community, hash);
    expect(verifyAccessToken(token, community, hash)).toBe(true);
    expect(verifyAccessToken(token, other, hash)).toBe(false);
    expect(verifyAccessToken(token, community, "scrypt$16384$8$1$salt$changed")).toBe(false);
  });

  test("expired, tampered, and garbage tokens are rejected", () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 3600 * 1000;
    expect(verifyAccessToken(createAccessToken(community, hash, eightDaysAgo), community, hash)).toBe(false);

    const token = createAccessToken(community, hash);
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ c: community, f: "x", e: Date.now() + 1e12 })).toString("base64url");
    expect(verifyAccessToken(`${forged}.${signature}`, community, hash)).toBe(false);
    expect(verifyAccessToken(`${payload}.${signature.slice(0, -2)}xx`, community, hash)).toBe(false);
    for (const garbage of ["", "abc", ".", "a.b.c", "....."]) {
      expect(verifyAccessToken(garbage, community, hash)).toBe(false);
    }
  });

  test("the cookie name is per community", () => {
    expect(accessCookieName(community)).not.toBe(accessCookieName(other));
  });

  test("a missing or short secret is refused", () => {
    const saved = process.env.COOKIE_SECRET;
    process.env.COOKIE_SECRET = "short";
    expect(() => createAccessToken(community, hash)).toThrow();
    delete process.env.COOKIE_SECRET;
    expect(() => createAccessToken(community, hash)).toThrow();
    process.env.COOKIE_SECRET = saved;
  });
});
