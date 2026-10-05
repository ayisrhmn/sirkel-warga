import { describe, expect, test } from "bun:test";
import { parseBackup } from "./backup";

const valid = () => ({
  format: "sirkel-backup",
  version: 1,
  exportedAt: "2026-10-05T00:00:00.000Z",
  community: { slug: "dawis-matahari-sektor-3", name: "Dawis Matahari - Sektor 3" },
  members: [],
  announcements: [{ title: "Kerja bakti", body: "Minggu pagi", status: "public", publishedAt: "2026-10-05T00:00:00.000Z" }],
  events: [{ title: "Ronda malam", startsAt: "2026-10-08T12:30:00.000Z", location: null, description: null }],
  contacts: [{ name: "Ani", role: "Ketua RT", phone: "0812-3456-7890", sortOrder: 1 }],
  datasets: [{ title: "Ringkasan", period: null, visibility: "public", columns: ["a"], rows: [["x"]] }],
});

describe("parseBackup", () => {
  test("accepts a well-formed backup", () => {
    const result = parseBackup(JSON.stringify(valid()));
    expect("data" in result && result.data.community.slug).toBe("dawis-matahari-sektor-3");
  });

  test("members in the file are ignored, never restored", () => {
    const withMembers = { ...valid(), members: [{ username: "evil", name: "Evil", role: "owner" }] };
    const result = parseBackup(JSON.stringify(withMembers));
    expect("data" in result && result.data.members).toEqual([]);
  });

  test("rejects anything else", () => {
    const base = valid();
    for (const bad of [
      "not json",
      "[]",
      JSON.stringify({}),
      JSON.stringify({ ...base, format: "other" }),
      JSON.stringify({ ...base, version: 2 }),
      JSON.stringify({ ...base, community: { slug: "x", name: "ab" } }),
      JSON.stringify({ ...base, announcements: [{ ...base.announcements[0], status: "secret" }] }),
      JSON.stringify({ ...base, announcements: [{ ...base.announcements[0], publishedAt: "kemarin" }] }),
      JSON.stringify({ ...base, events: [{ ...base.events[0], startsAt: "soon" }] }),
      JSON.stringify({ ...base, contacts: [{ ...base.contacts[0], phone: "call me" }] }),
      JSON.stringify({ ...base, contacts: [{ ...base.contacts[0], sortOrder: 5000 }] }),
      JSON.stringify({ ...base, datasets: [{ ...base.datasets[0], rows: [["x", "extra"]] }] }),
      JSON.stringify({ ...base, datasets: [{ ...base.datasets[0], visibility: "everyone" }] }),
      JSON.stringify({ ...base, announcements: Array.from({ length: 2001 }, () => base.announcements[0]) }),
    ]) {
      expect("error" in parseBackup(bad)).toBe(true);
    }
  });
});
