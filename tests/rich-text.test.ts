// Integration test for rich text announcements and events: what is stored, what
// the detail pages can read, and that backups keep the documents.
// Run with: bun run test
import { describe, expect, test } from "bun:test";
import { doc, form, login, m, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const rich = JSON.stringify({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Kerja bakti" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Bawa " },
        { type: "text", text: "sapu", marks: [{ type: "bold" }] },
        { type: "text", text: " dan " },
        { type: "text", text: "karung", marks: [{ type: "link", attrs: { href: "https://contoh.id/karung" } }] },
      ],
    },
    { type: "script", content: [{ type: "text", text: "alert(1)" }] },
  ],
});
const community = (slug: string) => m.db.community.findUniqueOrThrow({ where: { slug } });

describe("rich text content", () => {
  test("setup: two communities", async () => {
    for (const [username, name, slug] of [
      ["owner_a", "Dawis Matahari - Sektor 3", slugA],
      ["owner_b", "RT 05 Melati", slugB],
    ]) {
      await register(username);
      await login(username);
      await rejects(m.createCommunity({}, form({ name, slug })), `REDIRECT:/admin/${slug}`);
    }
    await login("owner_a");
  });

  test("an announcement is stored as a cleaned document plus its plain text", async () => {
    expect((await m.announcements.createAnnouncement(slugA, {}, form({ title: "Kerja bakti", bodyDoc: rich, status: "public" }))).ok).toBeDefined();
    const stored = await m.db.announcement.findFirstOrThrow({ where: { title: "Kerja bakti" } });
    expect(stored.body).toBe("Kerja bakti\nBawa sapu dan karung");
    expect(JSON.stringify(stored.bodyDoc)).toContain("https://contoh.id/karung");
    expect(JSON.stringify(stored.bodyDoc)).not.toContain("script");
  });

  test("an empty editor, a broken document, and a huge one are refused with a message", async () => {
    for (const bodyDoc of [doc(""), "", "bukan json", JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(5001) }] }] })]) {
      const result = await m.announcements.createAnnouncement(slugA, {}, form({ title: "Judul ok", bodyDoc, status: "public" }));
      expect(result.error).toContain("Isi pengumuman");
      expect(result.values?.title).toBe("Judul ok"); // the form keeps what was typed
    }
    expect(await m.db.announcement.count()).toBe(1);
  });

  test("an event description is optional; empty means none", async () => {
    const day = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10) + "T19:30";
    await m.events.createEvent(slugA, {}, form({ title: "Rapat warga", startsAt: day, location: "Balai", descriptionDoc: rich }));
    await m.events.createEvent(slugA, {}, form({ title: "Ronda", startsAt: day, location: "", descriptionDoc: doc("") }));
    const withText = await m.db.event.findFirstOrThrow({ where: { title: "Rapat warga" } });
    const without = await m.db.event.findFirstOrThrow({ where: { title: "Ronda" } });
    expect(withText.description).toBe("Kerja bakti\nBawa sapu dan karung");
    expect(withText.descriptionDoc).not.toBeNull();
    expect(without.description).toBeNull();
    expect(without.descriptionDoc).toBeNull();

    // Editing to empty clears the document again.
    await m.events.updateEvent(slugA, withText.id, {}, form({ title: "Rapat warga", startsAt: day, location: "Balai", descriptionDoc: doc("") }));
    const cleared = await m.db.event.findUniqueOrThrow({ where: { id: withText.id } });
    expect([cleared.description, cleared.descriptionDoc]).toEqual([null, null]);
  });

  test("detail pages read public announcements and events, never drafts or other communities", async () => {
    const a = await community(slugA);
    const b = await community(slugB);
    await m.announcements.createAnnouncement(slugA, {}, form({ title: "Belum final", bodyDoc: doc("rahasia"), status: "draft" }));
    const pub = await m.db.announcement.findFirstOrThrow({ where: { title: "Kerja bakti" } });
    const draft = await m.db.announcement.findFirstOrThrow({ where: { title: "Belum final" } });
    const event = await m.db.event.findFirstOrThrow({ where: { title: "Ronda" } });

    expect((await m.publicDetail.getPublicAnnouncement(a, pub.id))?.title).toBe("Kerja bakti");
    expect(await m.publicDetail.getPublicAnnouncement(a, draft.id)).toBeNull();
    expect(await m.publicDetail.getPublicAnnouncement(b, pub.id)).toBeNull();
    expect((await m.publicDetail.getPublicEvent(a, event.id))?.title).toBe("Ronda");
    expect(await m.publicDetail.getPublicEvent(b, event.id)).toBeNull();
  });

  test("the public list carries previews, not the whole text", async () => {
    const content = await m.getPublicContent(await community(slugA));
    expect(content.announcements.map((x) => x.excerpt)).toEqual(["Kerja bakti Bawa sapu dan karung"]);
    expect(content.events.find((e) => e.title === "Rapat warga")?.excerpt).toBe("");
  });

  test("a backup keeps the documents and restoring brings them back", async () => {
    const response = await m.backupRoute(new Request("http://x"), { params: Promise.resolve({ communitySlug: slugA }) });
    const backup = JSON.parse(await response.text());
    const original = await m.db.announcement.findFirstOrThrow({ where: { title: "Kerja bakti" } });
    expect(backup.announcements.find((x: { title: string }) => x.title === "Kerja bakti").bodyDoc).toEqual(original.bodyDoc);

    // A hand-edited backup is cleaned like a form would be.
    backup.announcements[0].bodyDoc = JSON.parse(rich);
    backup.announcements[0].bodyDoc.content.push({ type: "image", attrs: { src: "x" } });
    const { parseBackup } = await import("../src/lib/backup");
    const parsed = parseBackup(JSON.stringify(backup));
    expect("data" in parsed).toBe(true);
    if ("data" in parsed) expect(JSON.stringify(parsed.data.announcements)).not.toContain("image");

    // A backup from before rich text has no documents at all.
    delete backup.announcements[0].bodyDoc;
    const old = parseBackup(JSON.stringify(backup));
    expect("data" in old && old.data.announcements[0].bodyDoc).toBeNull();
  });
});
