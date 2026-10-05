// Integration test for the `protected` dataset gate: the password, the signed
// cookie, isolation between communities, and the attempt limit.
// Run with: bun run test
import { describe, expect, test } from "bun:test";
import { form, jar, login, m, PASSWORD, register, rejects, setForwardedFor, setupTestEnv } from "./helpers";

setupTestEnv();

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";
const SECRET_NAME = "RAHASIA-BUDI";

const ids = { protectedA: "", publicA: "", draftA: "", protectedB: "" };
let communityA = { id: "" };
let communityB = { id: "" };
let oldToken = "";

const dataset = (title: string, visibility: string, cell = "x") => ({
  title,
  period: "Oktober 2026",
  visibility,
  columns: ["Nama", "Status"],
  rows: [[cell, "belum bayar"]],
});
const view = (slug: string, id: string) => m.getProtectedDataset(slug, id);
const unlock = (slug: string, id: string, password: string) =>
  m.unlockDatasets(slug, id, {}, form({ password }));
const cookieOf = (communityId: string) => jar.get(m.access.accessCookieName(communityId));
const anonymous = () => jar.clear();

describe("setup", () => {
  test("two communities with datasets of every visibility", async () => {
    for (const [username, name, slug] of [
      ["owner_a", "Dawis Matahari - Sektor 3", slugA],
      ["owner_b", "RT 05 Melati", slugB],
    ]) {
      await register(username);
      await login(username);
      await rejects(m.createCommunity({}, form({ name, slug })), `REDIRECT:/admin/${slug}`);
    }
    await login("owner_a");
    await m.users.createAdmin(slugA, {}, form({ name: "Admin A", username: "adm_a", password: PASSWORD }));
    await m.db.user.update({ where: { username: "adm_a" }, data: { mustChangePassword: false } });

    for (const [slug, input] of [
      [slugA, dataset("Rincian nunggak", "protected", SECRET_NAME)],
      [slugA, dataset("Ringkasan kas", "public")],
      [slugA, dataset("Draft", "draft")],
      [slugB, dataset("Rincian B", "protected", "RAHASIA-B")],
    ] as const) {
      if (slug === slugB) await login("owner_b");
      else await login("owner_a");
      await rejects(m.datasets.createDataset(slug, input), `REDIRECT:/admin/${slug}/datasets`);
    }
    const find = async (title: string) => (await m.db.dataset.findFirstOrThrow({ where: { title } })).id;
    ids.protectedA = await find("Rincian nunggak");
    ids.publicA = await find("Ringkasan kas");
    ids.draftA = await find("Draft");
    ids.protectedB = await find("Rincian B");
    communityA = await m.db.community.findUniqueOrThrow({ where: { slug: slugA } });
    communityB = await m.db.community.findUniqueOrThrow({ where: { slug: slugB } });
  });
});

describe("setting the password", () => {
  test("only the super admin of that community can set it", async () => {
    const attempt = (slug: string) => m.settings.setProtectedPassword(slug, {}, form({ password: "rahasia-rt" }));
    await login("adm_a");
    await rejects(attempt(slugA), NOT_FOUND);
    await login("owner_b");
    await rejects(attempt(slugA), NOT_FOUND);
    expect((await m.db.community.findUniqueOrThrow({ where: { slug: slugA } })).protectedPasswordHash).toBeNull();
  });

  test("it is validated and stored only as a hash", async () => {
    await login("owner_a");
    expect((await m.settings.setProtectedPassword(slugA, {}, form({ password: "abc" }))).error).toBeDefined();
    expect((await m.settings.setProtectedPassword(slugA, {}, form({ password: "x".repeat(65) }))).error).toBeDefined();

    expect((await m.settings.setProtectedPassword(slugA, {}, form({ password: "rahasia-rt" }))).ok).toBeDefined();
    const { protectedPasswordHash } = await m.db.community.findUniqueOrThrow({ where: { slug: slugA } });
    expect(protectedPasswordHash?.startsWith("scrypt$")).toBe(true);
    expect(protectedPasswordHash).not.toContain("rahasia-rt");
  });
});

describe("the gate", () => {
  test("without a password set, nobody can open protected data", async () => {
    anonymous();
    const result = await view(slugB, ids.protectedB);
    expect(result).toMatchObject({ state: "locked", hasPassword: false });
    expect((await unlock(slugB, ids.protectedB, "apa-saja")).error).toBe("Pengurus belum menetapkan password.");
  });

  test("a visitor without the cookie sees no data at all", async () => {
    anonymous();
    const result = await view(slugA, ids.protectedA);
    expect(result).toMatchObject({ state: "locked", hasPassword: true, title: "Rincian nunggak" });
    expect(JSON.stringify(result)).not.toContain(SECRET_NAME);
    expect("rows" in result || "columns" in result).toBe(false);
  });

  test("a wrong password is refused and sets no cookie", async () => {
    expect((await unlock(slugA, ids.protectedA, "salah")).error).toBe("Password salah.");
    expect(cookieOf(communityA.id)).toBeUndefined();
    expect((await view(slugA, ids.protectedA)).state).toBe("locked");
  });

  test("the right password opens the data for this visitor", async () => {
    await rejects(unlock(slugA, ids.protectedA, "rahasia-rt"), `REDIRECT:/${slugA}/protected/${ids.protectedA}`);
    oldToken = cookieOf(communityA.id)!;
    expect(oldToken).toBeDefined();

    const result = await view(slugA, ids.protectedA);
    expect(result.state).toBe("open");
    expect(result.state === "open" && result.rows).toEqual([[SECRET_NAME, "belum bayar"]]);
  });

  test("the cookie of community A does not open community B", async () => {
    const saved = new Map(jar);
    await login("owner_b");
    await m.settings.setProtectedPassword(slugB, {}, form({ password: "rahasia-b" }));
    jar.clear();
    for (const [name, value] of saved) jar.set(name, value);

    // The visitor's A cookie, presented under B's cookie name as well.
    jar.set(m.access.accessCookieName(communityB.id), oldToken);
    expect((await view(slugB, ids.protectedB)).state).toBe("locked");
    expect((await view(slugA, ids.protectedA)).state).toBe("open");
  });

  test("another community's dataset id is not found through this community", async () => {
    expect((await view(slugA, ids.protectedB)).state).toBe("not-found");
    expect((await view(slugB, ids.protectedA)).state).toBe("not-found");
  });

  test("tampered, expired, and garbage cookies are refused", async () => {
    const name = m.access.accessCookieName(communityA.id);
    const { protectedPasswordHash } = await m.db.community.findUniqueOrThrow({ where: { id: communityA.id } });

    for (const value of [
      oldToken.slice(0, -3) + "abc",
      "garbage",
      "",
      m.access.createAccessToken(communityA.id, protectedPasswordHash!, Date.now() - 8 * 24 * 3600 * 1000),
      m.access.createAccessToken(communityB.id, protectedPasswordHash!),
    ]) {
      jar.set(name, value);
      expect((await view(slugA, ids.protectedA)).state).toBe("locked");
    }
  });

  test("public, draft, and unknown datasets never come from the protected route", async () => {
    jar.set(m.access.accessCookieName(communityA.id), oldToken);
    expect((await view(slugA, ids.publicA)).state).toBe("public");
    expect((await view(slugA, ids.draftA)).state).toBe("not-found");
    expect((await view(slugA, "99999999-9999-4999-8999-999999999999")).state).toBe("not-found");
    expect((await view("tidak-ada", ids.protectedA)).state).toBe("not-found");
  });

  test("changing the password signs every visitor out", async () => {
    await login("owner_a");
    await m.settings.setProtectedPassword(slugA, {}, form({ password: "password-baru" }));

    anonymous();
    jar.set(m.access.accessCookieName(communityA.id), oldToken);
    expect((await view(slugA, ids.protectedA)).state).toBe("locked");
    expect((await unlock(slugA, ids.protectedA, "rahasia-rt")).error).toBe("Password salah.");
    await rejects(unlock(slugA, ids.protectedA, "password-baru"), `REDIRECT:/${slugA}/protected/${ids.protectedA}`);
    expect((await view(slugA, ids.protectedA)).state).toBe("open");
  });
});

describe("attempt limit", () => {
  const reset = () => m.db.$executeRawUnsafe('DELETE FROM "rateLimit" WHERE "key" LIKE \'unlock:%\'');

  test("five wrong guesses lock this address out, even for the right password", async () => {
    await reset();
    anonymous();
    setForwardedFor("203.0.113.7");
    for (let i = 0; i < 5; i++) {
      expect((await unlock(slugA, ids.protectedA, `tebak-${i}`)).error).toBe("Password salah.");
    }
    expect((await unlock(slugA, ids.protectedA, "tebak-6")).error).toContain("Terlalu banyak percobaan");
    expect((await unlock(slugA, ids.protectedA, "password-baru")).error).toContain("Terlalu banyak percobaan");
    expect(cookieOf(communityA.id)).toBeUndefined();
  });

  test("another address is not affected", async () => {
    setForwardedFor("198.51.100.9");
    await rejects(unlock(slugA, ids.protectedA, "password-baru"), `REDIRECT:/${slugA}/protected/${ids.protectedA}`);
  });

  test("a correct password resets the counter", async () => {
    await reset();
    anonymous();
    setForwardedFor("192.0.2.44");
    for (let i = 0; i < 4; i++) await unlock(slugA, ids.protectedA, "salah");
    await rejects(unlock(slugA, ids.protectedA, "password-baru"), `REDIRECT:/${slugA}/protected/${ids.protectedA}`);
    for (let i = 0; i < 5; i++) {
      expect((await unlock(slugA, ids.protectedA, "salah")).error).toBe("Password salah.");
    }
  });

  test("guessing from many addresses is capped for the whole community", async () => {
    await m.db.$executeRawUnsafe('DELETE FROM "rateLimit"');
    anonymous();
    // 100 wrong guesses from 25 different addresses (5 each, under the per-address limit).
    for (let i = 0; i < 100; i++) {
      setForwardedFor(`10.0.${Math.floor(i / 5)}.1`);
      expect((await unlock(slugA, ids.protectedA, `tebak-${i}`)).error).toBe("Password salah.");
    }
    // A new address is now refused, even with the right password.
    setForwardedFor("10.9.9.9");
    for (const password of ["tebak-lagi", "password-baru"]) {
      expect((await unlock(slugA, ids.protectedA, password)).error).toContain("komunitas ini");
    }
    expect(cookieOf(communityA.id)).toBeUndefined();

    // Visitors who unlocked earlier keep their access.
    const { protectedPasswordHash } = await m.db.community.findUniqueOrThrow({ where: { id: communityA.id } });
    jar.set(m.access.accessCookieName(communityA.id), m.access.createAccessToken(communityA.id, protectedPasswordHash!));
    expect((await view(slugA, ids.protectedA)).state).toBe("open");

    // The other community is not affected.
    await rejects(unlock(slugB, ids.protectedB, "rahasia-b"), `REDIRECT:/${slugB}/protected/${ids.protectedB}`);
    await m.db.$executeRawUnsafe('DELETE FROM "rateLimit"');
  }, 120_000);

  test("correct passwords do not count towards the community cap", async () => {
    await m.db.$executeRawUnsafe('DELETE FROM "rateLimit"');
    for (let i = 0; i < 30; i++) {
      anonymous();
      setForwardedFor(`10.1.${i}.1`);
      await rejects(unlock(slugA, ids.protectedA, "password-baru"), `REDIRECT:/${slugA}/protected/${ids.protectedA}`);
    }
    // 30 successes were handed back, so all 100 wrong guesses are still available.
    for (let i = 0; i < 100; i++) {
      anonymous();
      setForwardedFor(`10.2.${Math.floor(i / 5)}.1`);
      expect((await unlock(slugA, ids.protectedA, `tebak-${i}`)).error).toBe("Password salah.");
    }
    setForwardedFor("10.9.9.9");
    expect((await unlock(slugA, ids.protectedA, "tebak")).error).toContain("komunitas ini");
    await m.db.$executeRawUnsafe('DELETE FROM "rateLimit"');
  }, 120_000);

  test("parallel guesses cannot exceed the limit", async () => {
    await reset();
    setForwardedFor("192.0.2.99");
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => unlock(slugA, ids.protectedA, `paralel-${i}`)));
    expect(results.filter((r) => r.error === "Password salah.").length).toBe(5);
    expect(results.filter((r) => r.error?.includes("Terlalu banyak")).length).toBe(7);
  });
});
