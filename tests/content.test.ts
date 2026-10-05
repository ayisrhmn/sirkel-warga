// Integration test for announcements, events, contacts, and the public page
// data. Run with: bun run test
import { describe, expect, test } from "bun:test";
import { form, login, m, PASSWORD, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";

const publicOf = async (slug: string) =>
  m.getPublicContent(await m.db.community.findUniqueOrThrow({ where: { slug } }));
const day = (offset: number) => {
  const date = new Date(Date.now() + offset * 24 * 3600 * 1000 + 7 * 3600 * 1000);
  return `${date.toISOString().slice(0, 10)}T19:30`;
};

describe("setup", () => {
  test("two communities, an owner each, and an admin in community A", async () => {
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
    // Skip the forced password change: it is covered in multi-tenant.test.ts.
    await m.db.user.update({ where: { username: "adm_a" }, data: { mustChangePassword: false } });
  });
});

describe("announcements", () => {
  test("only public announcements reach the public page; admins can manage them", async () => {
    await login("adm_a");
    expect((await m.announcements.createAnnouncement(slugA, {}, form({ title: "ab", body: "x", status: "public" }))).error).toBeDefined();
    expect((await m.announcements.createAnnouncement(slugA, {}, form({ title: "Kerja bakti", body: "Minggu pagi\nbawa sapu", status: "public" }))).ok).toBeDefined();
    expect((await m.announcements.createAnnouncement(slugA, {}, form({ title: "Rencana rahasia", body: "belum final", status: "draft" }))).ok).toBeDefined();

    expect((await publicOf(slugA)).announcements.map((a) => a.title)).toEqual(["Kerja bakti"]);
  });

  test("publishing a draft shows it and sets its public date", async () => {
    const draft = await m.db.announcement.findFirstOrThrow({ where: { title: "Rencana rahasia" } });
    const before = draft.publishedAt;
    const result = await m.announcements.updateAnnouncement(slugA, draft.id, {}, form({ title: "Rencana final", body: "sudah final", status: "public" }));
    expect(result.ok).toBeDefined();

    const updated = await m.db.announcement.findUniqueOrThrow({ where: { id: draft.id } });
    expect(updated.publishedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect((await publicOf(slugA)).announcements.map((a) => a.title).sort()).toEqual(["Kerja bakti", "Rencana final"]);
  });

  test("deleting removes it; unknown or malformed ids are a 404", async () => {
    const item = await m.db.announcement.findFirstOrThrow({ where: { title: "Rencana final" } });
    await m.announcements.deleteAnnouncement(slugA, item.id);
    expect((await publicOf(slugA)).announcements.length).toBe(1);
    await rejects(m.announcements.deleteAnnouncement(slugA, item.id), NOT_FOUND);
    await rejects(m.announcements.deleteAnnouncement(slugA, "not-a-uuid"), NOT_FOUND);
  });
});

describe("events", () => {
  test("only upcoming events reach the public page, in WIB", async () => {
    await m.events.createEvent(slugA, {}, form({ title: "Ronda malam", startsAt: day(3), location: "Pos ronda", description: "" }));
    await m.events.createEvent(slugA, {}, form({ title: "Posyandu lama", startsAt: day(-10), location: "", description: "" }));
    expect((await m.events.createEvent(slugA, {}, form({ title: "Rusak", startsAt: "besok", location: "", description: "" }))).error).toBeDefined();

    const events = (await publicOf(slugA)).events;
    expect(events.map((e) => e.title)).toEqual(["Ronda malam"]);
    expect(events[0].location).toBe("Pos ronda");
    expect(events[0].description).toBeNull();
    // 19:30 WIB is 12:30 UTC.
    expect(new Date(events[0].startsAt).getUTCHours()).toBe(12);
  });
});

describe("contacts", () => {
  test("contacts are ordered by sort order, and the phone number is validated", async () => {
    await m.contacts.createContact(slugA, {}, form({ name: "Budi", role: "Ronda", phone: "0812-3456-7890", sortOrder: "2" }));
    await m.contacts.createContact(slugA, {}, form({ name: "Ani", role: "Ketua RT", phone: "+62 811 222 333", sortOrder: "1" }));
    expect((await m.contacts.createContact(slugA, {}, form({ name: "Cici", role: "Kas", phone: "call me", sortOrder: "0" }))).error).toBeDefined();
    expect((await m.contacts.createContact(slugA, {}, form({ name: "Dodo", role: "Kas", phone: "08123456", sortOrder: "-1" }))).error).toBeDefined();

    expect((await publicOf(slugA)).contacts.map((c) => c.name)).toEqual(["Ani", "Budi"]);
  });
});

describe("isolation between communities", () => {
  test("owner of B cannot read or change community A's content, even with valid ids", async () => {
    const announcement = await m.db.announcement.findFirstOrThrow({ where: { title: "Kerja bakti" } });
    const event = await m.db.event.findFirstOrThrow({ where: { title: "Ronda malam" } });
    const contact = await m.db.contact.findFirstOrThrow({ where: { name: "Ani" } });
    await login("owner_b");

    // Through A's slug: not a member.
    await rejects(m.announcements.deleteAnnouncement(slugA, announcement.id), NOT_FOUND);
    await rejects(m.events.updateEvent(slugA, event.id, {}, form({ title: "Hijack", startsAt: day(1), location: "", description: "" })), NOT_FOUND);
    await rejects(m.contacts.createContact(slugA, {}, form({ name: "Evil", role: "Spy", phone: "0000000", sortOrder: "0" })), NOT_FOUND);

    // Through B's own slug but A's row ids: the row is not in B.
    await rejects(m.announcements.deleteAnnouncement(slugB, announcement.id), NOT_FOUND);
    await rejects(m.announcements.updateAnnouncement(slugB, announcement.id, {}, form({ title: "Hijacked", body: "x", status: "public" })), NOT_FOUND);
    await rejects(m.events.deleteEvent(slugB, event.id), NOT_FOUND);
    await rejects(m.events.updateEvent(slugB, event.id, {}, form({ title: "Hijack", startsAt: day(1), location: "", description: "" })), NOT_FOUND);
    await rejects(m.contacts.deleteContact(slugB, contact.id), NOT_FOUND);
    await rejects(m.contacts.updateContact(slugB, contact.id, {}, form({ name: "Hijack", role: "Spy", phone: "0000000", sortOrder: "0" })), NOT_FOUND);

    expect((await m.db.announcement.findUniqueOrThrow({ where: { id: announcement.id } })).title).toBe("Kerja bakti");
    expect((await m.db.event.findUniqueOrThrow({ where: { id: event.id } })).title).toBe("Ronda malam");
    expect((await m.db.contact.findUniqueOrThrow({ where: { id: contact.id } })).name).toBe("Ani");
    expect(await m.db.contact.count({ where: { name: "Evil" } })).toBe(0);
  });

  test("each public page only contains its own community's content", async () => {
    await m.announcements.createAnnouncement(slugB, {}, form({ title: "Rapat RT 05", body: "Jumat malam", status: "public" }));
    expect((await publicOf(slugB)).announcements.map((a) => a.title)).toEqual(["Rapat RT 05"]);
    expect((await publicOf(slugB)).contacts).toEqual([]);
    expect((await publicOf(slugA)).announcements.map((a) => a.title)).toEqual(["Kerja bakti"]);
  });
});
