// Integration test for the platform admin: no communities of their own, but
// forced access to any community. Run with: bun run test
import { describe, expect, test } from "bun:test";
import { doc, form, login, m, PASSWORD, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";
const params = (p: Record<string, string>) => ({ params: Promise.resolve(p) }) as never;
const restoreForm = (text: string) => {
  const data = new FormData();
  data.set("file", new File([text], "cadangan.json", { type: "application/json" }));
  return data;
};

describe("platform admin", () => {
  test("setup: two communities, a platform admin, and a pending account", async () => {
    for (const [username, name, slug] of [
      ["owner_a", "Dawis Matahari - Sektor 3", slugA],
      ["owner_b", "RT 05 Melati", slugB],
    ]) {
      await register(username);
      await login(username);
      await rejects(m.createCommunity({}, form({ name, slug })), `REDIRECT:/admin/${slug}`);
    }
    await login("owner_a");
    await m.announcements.createAnnouncement(slugA, {}, form({ title: "Kerja bakti", bodyDoc: doc("Minggu pagi"), status: "public" }));

    await register("ops");
    await m.db.user.update({ where: { username: "ops" }, data: { isPlatformAdmin: true } });
    await register("calon", false);
  });

  test("a platform admin cannot create or restore a community", async () => {
    await login("ops");
    const before = await m.db.community.count();
    const created = await m.createCommunity({}, form({ name: "Punya Ops", slug: "punya-ops" }));
    expect(created.error).toBe("Akun platform admin tidak bisa membuat komunitas.");

    const backup = await (await m.backupRoute(new Request("http://x"), params({ communitySlug: slugA }))).text();
    expect((await m.restoreCommunity({}, restoreForm(backup))).error).toBe("Akun platform admin tidak bisa membuat komunitas.");
    expect(await m.db.community.count()).toBe(before);
  });

  test("it gets forced access with super admin rights to any community", async () => {
    const a = await m.requireMember(slugA, { owner: true });
    expect(a).toMatchObject({ role: "owner", forced: true, community: { slug: slugA } });
    expect((await m.requireMember(slugB)).forced).toBe(true);
    await rejects(m.requireMember("tidak-ada"), NOT_FOUND);
  });

  test("members are not forced, and other members still cannot cross communities", async () => {
    await login("owner_a");
    expect(await m.requireMember(slugA)).toMatchObject({ role: "owner", forced: false });
    await rejects(m.requireMember(slugB), NOT_FOUND);
  });

  test("forced mode can edit, manage users, back up, and write content", async () => {
    await login("ops");
    expect((await m.settings.renameCommunity(slugB, {}, form({ name: "RT 05 Melati Baru" }))).ok).toBeDefined();
    expect((await m.settings.setTimezone(slugB, {}, form({ timezone: "Asia/Makassar" }))).ok).toBeDefined();
    expect((await m.db.community.findUniqueOrThrow({ where: { slug: slugB } })).name).toBe("RT 05 Melati Baru");

    expect((await m.announcements.createAnnouncement(slugB, {}, form({ title: "Dari platform", bodyDoc: doc("isi"), status: "public" }))).ok).toBeDefined();
    const created = await m.users.createAdmin(slugB, {}, form({ name: "Admin B", username: "adm_b", password: PASSWORD }));
    expect(created.ok).toBeDefined();

    const response = await m.backupRoute(new Request("http://x"), params({ communitySlug: slugB }));
    expect((await response.json()).community.slug).toBe(slugB);
  });

  test("forced mode can delete a community; the owner's account stays", async () => {
    await login("ops");
    expect((await m.settings.deleteCommunity(slugB, {}, form({ confirm: "salah" }))).error).toBeDefined();
    await rejects(m.settings.deleteCommunity(slugB, {}, form({ confirm: slugB })), "REDIRECT:/admin");

    expect(await m.db.community.count({ where: { slug: slugB } })).toBe(0);
    expect(await m.db.user.count({ where: { username: "adm_b" } })).toBe(0); // its admin goes with it
    expect(await m.db.user.count({ where: { username: "owner_b" } })).toBe(1);
    expect(await m.db.community.count({ where: { slug: slugA } })).toBe(1);
  });
});

describe("platform actions are for platform admins only", () => {
  test("approving and rejecting accounts needs the platform role", async () => {
    const { approveUser, rejectUser } = await import("../src/app/platform/actions");
    const calon = await m.db.user.findUniqueOrThrow({ where: { username: "calon" } });

    await login("owner_a");
    await rejects(approveUser(calon.id), NOT_FOUND);
    await rejects(rejectUser(calon.id), NOT_FOUND);
    expect((await m.db.user.findUniqueOrThrow({ where: { id: calon.id } })).approved).toBe(false);

    await login("ops");
    await approveUser(calon.id);
    expect((await m.db.user.findUniqueOrThrow({ where: { id: calon.id } })).approved).toBe(true);
    // Approved accounts can no longer be rejected (deleted) by mistake.
    await rejectUser(calon.id);
    expect(await m.db.user.count({ where: { id: calon.id } })).toBe(1);
  });
});
