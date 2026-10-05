// Integration test for the full community backup and restore.
// Run with: bun run test
import { describe, expect, test } from "bun:test";
import type { Prisma } from "../src/generated/prisma/client";
import { doc, form, jar, login, m, PASSWORD, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";
const params = (p: Record<string, string>) => ({ params: Promise.resolve(p) }) as never;

const restoreForm = (text: string, slug = "") => {
  const data = new FormData();
  data.set("file", new File([text], "cadangan.json", { type: "application/json" }));
  if (slug) data.set("slug", slug);
  return data;
};

let backupText = "";
let datasetRows: Prisma.JsonValue;

describe("backup", () => {
  test("setup: a community with every kind of content and an admin", async () => {
    await register("owner_a");
    await login("owner_a");
    await rejects(m.createCommunity({}, form({ name: "Dawis Matahari - Sektor 3", slug: slugA })), `REDIRECT:/admin/${slugA}`);
    await m.users.createAdmin(slugA, {}, form({ name: "Admin A", username: "adm_a", password: PASSWORD }));
    await m.db.user.update({ where: { username: "adm_a" }, data: { mustChangePassword: false } });
    await m.settings.setProtectedPassword(slugA, {}, form({ password: "rahasia-rt" }));
    await m.settings.setTimezone(slugA, {}, form({ timezone: "Asia/Makassar" }));

    await m.announcements.createAnnouncement(slugA, {}, form({ title: "Kerja bakti", bodyDoc: doc("Minggu pagi\nbawa sapu"), status: "public" }));
    await m.announcements.createAnnouncement(slugA, {}, form({ title: "Rencana", bodyDoc: doc("belum final"), status: "draft" }));
    await m.events.createEvent(slugA, {}, form({ title: "Ronda malam", startsAt: "2030-01-15T19:30", location: "Pos ronda", descriptionDoc: doc("Bawa senter") }));
    await m.contacts.createContact(slugA, {}, form({ name: "Ani", role: "Ketua RT", phone: "0812-3456-7890", sortOrder: "1" }));
    for (const [title, visibility] of [["Ringkasan kas", "public"], ["Rincian nunggak", "protected"], ["Draft laporan", "draft"]]) {
      await rejects(
        m.datasets.createDataset(slugA, { title, period: "Oktober 2026", visibility, columns: ["Nama", "Jumlah"], rows: [["Budi", 1500000.5], ["Total", null]], fills: [[1, 0, "FFFF00"], [1, 1, "FFFF00"]] }),
        `REDIRECT:/admin/${slugA}/datasets`,
      );
    }
    datasetRows = (await m.db.dataset.findFirstOrThrow({ where: { title: "Rincian nunggak" } })).rows;
  });

  test("the super admin downloads a full backup without any secret in it", async () => {
    const response = await m.backupRoute(new Request("http://x"), params({ communitySlug: slugA }));
    expect(response.headers.get("content-disposition")).toContain(`${slugA}-cadangan-`);
    backupText = await response.text();
    const backup = JSON.parse(backupText);

    expect(backup).toMatchObject({ format: "sirkel-backup", version: 1, community: { slug: slugA, name: "Dawis Matahari - Sektor 3", timezone: "Asia/Makassar" } });
    expect(backup.announcements.map((a: { title: string }) => a.title).sort()).toEqual(["Kerja bakti", "Rencana"]);
    expect(backup.events.length).toBe(1);
    expect(backup.contacts.length).toBe(1);
    expect(backup.datasets.map((d: { visibility: string }) => d.visibility).sort()).toEqual(["draft", "protected", "public"]);
    expect(backup.members.map((x: { username: string }) => x.username).sort()).toEqual(["adm_a", "owner_a"]);

    // No password hashes, no sessions, no ids that tie it to this database.
    expect(backupText).not.toContain("scrypt$");
    expect(backupText).not.toContain("protectedPasswordHash");
    expect(backupText).not.toMatch(/"(id|userId|communityId)"/);
  });

  test("only the super admin of that community can download it", async () => {
    const attempt = () => Promise.resolve(m.backupRoute(new Request("http://x"), params({ communitySlug: slugA })));
    await login("adm_a");
    await rejects(attempt(), NOT_FOUND);
    await register("owner_b");
    await login("owner_b");
    await rejects(m.createCommunity({}, form({ name: "RT 05 Melati", slug: slugB })), `REDIRECT:/admin/${slugB}`);
    await rejects(attempt(), NOT_FOUND);
    jar.clear();
    await rejects(attempt(), "REDIRECT:/login");
  });
});

describe("restore", () => {
  test("a deleted community comes back with all its content", async () => {
    await login("owner_a");
    await rejects(m.settings.deleteCommunity(slugA, {}, form({ confirm: slugA })), "REDIRECT:/admin");
    expect(await m.db.community.count({ where: { slug: slugA } })).toBe(0);
    expect(await m.db.dataset.count({ where: { title: "Rincian nunggak" } })).toBe(0);

    await rejects(m.restoreCommunity({}, restoreForm(backupText)), `REDIRECT:/admin/${slugA}`);

    const community = await m.db.community.findUniqueOrThrow({ where: { slug: slugA } });
    expect(community.name).toBe("Dawis Matahari - Sektor 3");
    expect(community.protectedPasswordHash).toBeNull(); // must be set again
    expect(community.timezone).toBe("Asia/Makassar");
    const owner = await m.db.membership.findFirstOrThrow({ where: { communityId: community.id }, include: { user: true } });
    expect([owner.role, owner.user.username]).toEqual(["owner", "owner_a"]);

    const content = await m.getPublicContent(community);
    expect(content.announcements.map((a) => a.title)).toEqual(["Kerja bakti"]);
    expect(content.announcements[0].excerpt).toBe("Minggu pagi bawa sapu");
    expect(content.events[0]).toMatchObject({ title: "Ronda malam", location: "Pos ronda", excerpt: "Bawa senter" });
    expect(content.contacts).toEqual([expect.objectContaining({ name: "Ani", role: "Ketua RT", phone: "0812-3456-7890" })]);
    expect(content.datasets.map((d) => d.title).sort()).toEqual(["Rincian nunggak", "Ringkasan kas"]);

    const protectedSet = await m.db.dataset.findFirstOrThrow({ where: { communityId: community.id, title: "Rincian nunggak" } });
    expect(protectedSet.visibility).toBe("protected");
    expect(protectedSet.rows).toEqual(datasetRows);
    expect(protectedSet.fills).toEqual([[1, 0, "FFFF00"], [1, 1, "FFFF00"]]);
    expect(await m.db.announcement.count({ where: { communityId: community.id, status: "draft" } })).toBe(1);
    expect(await m.db.user.count({ where: { username: "adm_a" } })).toBe(0); // accounts are not restored
  });

  test("a backup of the restored community matches the original", async () => {
    const again = JSON.parse(await (await m.backupRoute(new Request("http://x"), params({ communitySlug: slugA }))).text());
    const original = JSON.parse(backupText);
    for (const key of ["community", "announcements", "events", "contacts", "datasets"]) {
      expect(again[key]).toEqual(original[key]);
    }
  });
});

describe("restore refusals", () => {
  test("someone who already has a community cannot restore another", async () => {
    expect((await m.restoreCommunity({}, restoreForm(backupText, "slug-lain"))).error).toBe("Kamu sudah punya komunitas.");
  });

  test("a backup made before time zones existed restores as WIB", async () => {
    const old = JSON.parse(backupText);
    delete old.community.timezone;
    await register("owner_e");
    await login("owner_e");
    await rejects(m.restoreCommunity({}, restoreForm(JSON.stringify(old), "cadangan-lama")), "REDIRECT:/admin/cadangan-lama");
    expect((await m.db.community.findUniqueOrThrow({ where: { slug: "cadangan-lama" } })).timezone).toBe("Asia/Jakarta");
  });

  test("a taken slug is refused, and another slug can be chosen", async () => {
    await register("owner_c");
    await login("owner_c");
    expect((await m.restoreCommunity({}, restoreForm(backupText))).error).toContain("Slug sudah dipakai");
    expect((await m.restoreCommunity({}, restoreForm(backupText, "admin"))).error).toBeDefined();
    await rejects(m.restoreCommunity({}, restoreForm(backupText, "salinan-dawis")), "REDIRECT:/admin/salinan-dawis");
    expect(await m.db.community.count({ where: { slug: "salinan-dawis" } })).toBe(1);
    expect(await m.db.community.count({ where: { slug: slugA } })).toBe(1); // untouched
  });

  test("broken, edited, or oversized files are refused and nothing is created", async () => {
    await register("owner_d");
    await login("owner_d");
    const before = await m.db.community.count();
    const tampered = JSON.parse(backupText);
    tampered.datasets[0].rows = [["x"]]; // wrong column count

    for (const text of ["not json", "{}", JSON.stringify(tampered), JSON.stringify({ ...JSON.parse(backupText), contacts: [{ name: "x" }] })]) {
      expect((await m.restoreCommunity({}, restoreForm(text))).error).toBeDefined();
    }
    expect((await m.restoreCommunity({}, new FormData())).error).toBeDefined();
    expect((await m.restoreCommunity({}, restoreForm("x".repeat(3_600_000)))).error).toBe("File terlalu besar.");
    expect(await m.db.community.count()).toBe(before);
  });

  test("an unauthenticated visitor cannot restore", async () => {
    jar.clear();
    await rejects(m.restoreCommunity({}, restoreForm(backupText, "orang-asing")), "REDIRECT:/login");
  });
});
