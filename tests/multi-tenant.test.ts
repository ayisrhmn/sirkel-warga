// Integration test for accounts, roles, and community isolation.
// Runs the real Server Actions against a separate database (`sirkel_test`,
// created and migrated automatically); only Next.js request APIs are faked.
// Run with: bun test
import { Client } from "pg";
import { beforeAll, describe, expect, mock, test } from "bun:test";

// --- Fake Next.js request context ------------------------------------------

// A minimal browser cookie jar: requests send it, and Better Auth's
// nextCookies plugin updates it through cookies().set(...).
const jar = new Map<string, string>();
const cookieHeader = () =>
  [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
mock.module("next/headers", () => ({
  headers: async () => new Headers({ cookie: cookieHeader() }),
  cookies: async () => ({
    set: (name: string, value: string) => void jar.set(name, value),
    get: () => undefined,
    getAll: () => [],
    delete: (name: string) => void jar.delete(name),
  }),
}));
mock.module("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
mock.module("next/cache", () => ({
  revalidatePath() {},
  updateTag() {},
  unstable_cache: <T>(fn: T) => fn,
}));

// --- Separate database ------------------------------------------------------

const baseUrl = process.env.DATABASE_URL ?? "";
const testUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, "/sirkel_test$1");
if (!baseUrl || testUrl === baseUrl) throw new Error("DATABASE_URL not usable");

type Modules = {
  auth: typeof import("../src/lib/auth").auth;
  db: ReturnType<typeof import("../src/lib/db").getDb>;
  createCommunity: typeof import("../src/app/create-community/actions").createCommunity;
  users: typeof import("../src/app/admin/[communitySlug]/users/actions");
  settings: typeof import("../src/app/admin/[communitySlug]/settings/actions");
  changePassword: typeof import("../src/app/change-password/actions").changePassword;
  requireMember: typeof import("../src/lib/access").requireMember;
  requireUser: typeof import("../src/lib/session").requireUser;
};
let m: Modules;

beforeAll(async () => {
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  const exists = await admin.query("select 1 from pg_database where datname = 'sirkel_test'");
  if (exists.rowCount === 0) await admin.query("create database sirkel_test");
  await admin.end();

  const migrate = Bun.spawnSync(["bunx", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testUrl },
  });
  if (migrate.exitCode !== 0) throw new Error(migrate.stderr.toString());

  process.env.DATABASE_URL = testUrl;
  const { getDb } = await import("../src/lib/db");
  m = {
    auth: (await import("../src/lib/auth")).auth,
    db: getDb(),
    createCommunity: (await import("../src/app/create-community/actions")).createCommunity,
    users: await import("../src/app/admin/[communitySlug]/users/actions"),
    settings: await import("../src/app/admin/[communitySlug]/settings/actions"),
    changePassword: (await import("../src/app/change-password/actions")).changePassword,
    requireMember: (await import("../src/lib/access")).requireMember,
    requireUser: (await import("../src/lib/session")).requireUser,
  };
  await m.db.$executeRawUnsafe('TRUNCATE "user", "communities", "rateLimit" CASCADE');
}, 120_000);

// --- Helpers ----------------------------------------------------------------

const PASSWORD = "password-awal-1";
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const rejects = async (promise: Promise<unknown>, message: string) => {
  let error: unknown;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect((error as Error | undefined)?.message).toBe(message);
};

async function register(username: string, approved = true) {
  await m.auth.api.signUpEmail({
    body: {
      email: `${username}@users.sirkel.local`,
      password: PASSWORD,
      name: username,
      username,
    },
  });
  if (approved)
    await m.db.user.update({ where: { username }, data: { approved: true } });
}

async function login(username: string, password = PASSWORD) {
  const { headers } = await m.auth.api.signInUsername({
    body: { username, password },
    returnHeaders: true,
  });
  jar.clear();
  for (const setCookie of headers.getSetCookie()) {
    const [pair] = setCookie.split(";");
    const index = pair.indexOf("=");
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}

// --- Scenarios --------------------------------------------------------------

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";

describe("accounts", () => {
  test("an unapproved account cannot sign in", async () => {
    await register("pending", false);
    await expect(login("pending")).rejects.toThrow();
    expect(await m.db.session.count()).toBe(0);
  });
});

// Tests share state and run in order: each step builds on the previous one.
describe("communities, roles, and isolation", () => {
  const id = async (username: string) =>
    (await m.db.user.findUniqueOrThrow({ where: { username } })).id;

  test("creating a community makes the creator its owner", async () => {
    await register("owner_a");
    await login("owner_a");
    await rejects(
      m.createCommunity({}, form({ name: "Dawis Matahari - Sektor 3", slug: slugA })),
      `REDIRECT:/admin/${slugA}`,
    );
    const membership = await m.db.membership.findFirstOrThrow({
      where: { community: { slug: slugA } },
    });
    expect(membership.role).toBe("owner");
    expect(membership.userId).toBe(await id("owner_a"));
  });

  test("one community per account, no reserved or duplicate slugs", async () => {
    const again = await m.createCommunity({}, form({ name: "Another", slug: "another-one" }));
    expect(again.error).toBe("Kamu sudah punya komunitas.");

    await register("owner_b");
    await login("owner_b");
    for (const slug of ["admin", "login", "api", "has_underscore", "ab"]) {
      const result = await m.createCommunity({}, form({ name: "Test Name", slug }));
      expect(result.error).toBeDefined();
    }
    const duplicate = await m.createCommunity({}, form({ name: "Copycat", slug: slugA }));
    expect(duplicate.error).toBe("Slug sudah dipakai, coba yang lain.");

    await rejects(
      m.createCommunity({}, form({ name: "RT 05 Melati", slug: slugB })),
      `REDIRECT:/admin/${slugB}`,
    );
  });

  test("another community's owner is locked out of community A", async () => {
    // Still signed in as owner_b.
    await rejects(m.requireMember(slugA), NOT_FOUND);
    await rejects(m.users.createAdmin(slugA, {}, form({ name: "X Y", username: "xy", password: PASSWORD })), NOT_FOUND);
    await rejects(m.settings.renameCommunity(slugA, {}, form({ name: "Hijacked" })), NOT_FOUND);
    await rejects(m.settings.deleteCommunity(slugA, {}, form({ confirm: slugA })), NOT_FOUND);
    expect(await m.db.user.count({ where: { username: "xy" } })).toBe(0);
    expect((await m.db.community.findUniqueOrThrow({ where: { slug: slugA } })).name).toBe(
      "Dawis Matahari - Sektor 3",
    );
  });

  test("the owner creates an admin with a temporary password", async () => {
    await login("owner_a");
    const bad = await m.users.createAdmin(slugA, {}, form({ name: "Adm", username: "adm_a", password: "short" }));
    expect(bad.error).toBeDefined();

    const ok = await m.users.createAdmin(slugA, {}, form({ name: "Adm A", username: "adm_a", password: PASSWORD }));
    expect(ok.ok).toBeDefined();
    const user = await m.db.user.findUniqueOrThrow({ where: { username: "adm_a" } });
    expect(user.approved).toBe(true);
    expect(user.mustChangePassword).toBe(true);
    expect(
      await m.db.membership.count({ where: { userId: user.id, role: "admin", community: { slug: slugA } } }),
    ).toBe(1);

    const taken = await m.users.createAdmin(slugA, {}, form({ name: "Adm A", username: "adm_a", password: PASSWORD }));
    expect(taken.error).toBeDefined();
  });

  test("a new admin must change the temporary password first", async () => {
    await login("adm_a");
    await rejects(m.requireUser(), "REDIRECT:/change-password");
    await rejects(m.requireMember(slugA), "REDIRECT:/change-password");

    const wrong = await m.changePassword({}, form({ current: "wrong-password", new: "password-baru-1", confirm: "password-baru-1" }));
    expect(wrong.error).toBe("Password lama salah.");
    const mismatch = await m.changePassword({}, form({ current: PASSWORD, new: "password-baru-1", confirm: "different-one" }));
    expect(mismatch.error).toBeDefined();

    await rejects(
      m.changePassword({}, form({ current: PASSWORD, new: "password-baru-1", confirm: "password-baru-1" })),
      "REDIRECT:/admin",
    );
    expect((await m.db.user.findUniqueOrThrow({ where: { username: "adm_a" } })).mustChangePassword).toBe(false);
    expect((await m.requireMember(slugA)).role).toBe("admin");

    await expect(login("adm_a", PASSWORD)).rejects.toThrow();
    await login("adm_a", "password-baru-1");
  });

  test("an admin cannot touch community info or users", async () => {
    const ownerA = await id("owner_a");
    const admin = await id("adm_a");
    await rejects(m.requireMember(slugA, { owner: true }), NOT_FOUND);
    await rejects(m.users.createAdmin(slugA, {}, form({ name: "Z Z", username: "zz", password: PASSWORD })), NOT_FOUND);
    await rejects(m.users.resetPassword(slugA, ownerA, {}, form({ password: "hijack-pass-1" })), NOT_FOUND);
    await rejects(m.users.removeAdmin(slugA, admin), NOT_FOUND);
    await rejects(m.settings.renameCommunity(slugA, {}, form({ name: "Hijacked" })), NOT_FOUND);
    await rejects(m.settings.deleteCommunity(slugA, {}, form({ confirm: slugA })), NOT_FOUND);
    expect((await m.createCommunity({}, form({ name: "Mine Now", slug: "mine-now" }))).error).toBe(
      "Kamu sudah punya komunitas.",
    );
    expect(await m.db.user.count({ where: { username: "zz" } })).toBe(0);
  });

  test("the owner can rename the community", async () => {
    await login("owner_a");
    const result = await m.settings.renameCommunity(slugA, {}, form({ name: "Dawis Matahari Sektor 3" }));
    expect(result.ok).toBeDefined();
    expect((await m.requireMember(slugA)).community.name).toBe("Dawis Matahari Sektor 3");
    expect((await m.settings.renameCommunity(slugA, {}, form({ name: "ab" }))).error).toBeDefined();
  });

  test("resetting a password signs the admin out and forces a change", async () => {
    const admin = await id("adm_a");
    expect(await m.db.session.count({ where: { userId: admin } })).toBeGreaterThan(0);

    const result = await m.users.resetPassword(slugA, admin, {}, form({ password: "password-reset-2" }));
    expect(result.ok).toBeDefined();
    expect(await m.db.session.count({ where: { userId: admin } })).toBe(0);
    expect((await m.db.user.findUniqueOrThrow({ where: { id: admin } })).mustChangePassword).toBe(true);
    await expect(login("adm_a", "password-baru-1")).rejects.toThrow();
    await login("adm_a", "password-reset-2");
    await login("owner_a");
  });

  test("owners can only manage admins of their own community", async () => {
    const targets = [await id("owner_a"), await id("owner_b")];
    for (const target of targets) {
      await rejects(m.users.resetPassword(slugA, target, {}, form({ password: "hijack-pass-1" })), NOT_FOUND);
      await rejects(m.users.removeAdmin(slugA, target), NOT_FOUND);
    }
    expect(await m.db.user.count({ where: { username: { in: ["owner_a", "owner_b"] } } })).toBe(2);
  });

  test("removing an admin deletes the account and its access", async () => {
    const admin = await id("adm_a");
    await m.users.removeAdmin(slugA, admin);
    expect(await m.db.user.count({ where: { id: admin } })).toBe(0);
    expect(await m.db.session.count({ where: { userId: admin } })).toBe(0);
    expect(await m.db.membership.count({ where: { userId: admin } })).toBe(0);
    await expect(login("adm_a", "password-reset-2")).rejects.toThrow();
  });

  test("deleting a community removes its admins but keeps the owner and other communities", async () => {
    await login("owner_a");
    await m.users.createAdmin(slugA, {}, form({ name: "Adm Two", username: "adm_a2", password: PASSWORD }));

    const wrong = await m.settings.deleteCommunity(slugA, {}, form({ confirm: "nope" }));
    expect(wrong.error).toBeDefined();
    expect(await m.db.community.count({ where: { slug: slugA } })).toBe(1);

    await rejects(m.settings.deleteCommunity(slugA, {}, form({ confirm: slugA })), "REDIRECT:/admin");
    expect(await m.db.community.count({ where: { slug: slugA } })).toBe(0);
    expect(await m.db.user.count({ where: { username: "adm_a2" } })).toBe(0);
    expect(await m.db.user.count({ where: { username: "owner_a" } })).toBe(1);
    expect(await m.db.community.count({ where: { slug: slugB } })).toBe(1);

    // The owner has no community left and can create a new one.
    await rejects(
      m.createCommunity({}, form({ name: "Dawis Matahari - Sektor 3", slug: slugA })),
      `REDIRECT:/admin/${slugA}`,
    );
  });
});
