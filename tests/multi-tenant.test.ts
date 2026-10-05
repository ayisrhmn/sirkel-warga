// Integration test for accounts, roles, and community isolation.
// Run with: bun run test
import { describe, expect, test } from "bun:test";
import { form, login, m, PASSWORD, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

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
