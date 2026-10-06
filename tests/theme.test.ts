// Integration test for the community's primary colour.
// Run with: bun run test
import { describe, expect, test } from "bun:test";
import { form, login, m, PASSWORD, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

const slug = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";
const params = (p: Record<string, string>) => ({ params: Promise.resolve(p) }) as never;
const colorOf = async (s: string) => (await m.db.community.findUniqueOrThrow({ where: { slug: s } })).primaryColor;
const restoreForm = (text: string, newSlug: string) => {
  const data = new FormData();
  data.set("file", new File([text], "cadangan.json", { type: "application/json" }));
  data.set("slug", newSlug);
  return data;
};

describe("community colour", () => {
  test("a community is created with a chosen colour, or the default when none is sent", async () => {
    await register("owner_a");
    await login("owner_a");
    await rejects(m.createCommunity({}, form({ name: "RT 05 Melati", slug, primaryColor: "#1D4ED8" })), `REDIRECT:/admin/${slug}`);
    expect(await colorOf(slug)).toBe("#1d4ed8");

    await register("owner_b");
    await login("owner_b");
    await rejects(m.createCommunity({}, form({ name: "Gang Kenanga", slug: "gang-kenanga" })), "REDIRECT:/admin/gang-kenanga");
    expect(await colorOf("gang-kenanga")).toBe("#0e6b58");
  });

  test("a colour that is too light or not a colour is refused, and no community is made", async () => {
    await register("owner_c");
    await login("owner_c");
    const before = await m.db.community.count();
    for (const primaryColor of ["#ffff00", "kuning", "#fff;background:url(x)"]) {
      const result = await m.createCommunity({}, form({ name: "Terlalu Terang", slug: "terlalu-terang", primaryColor }));
      expect(result.error).toBeTruthy();
      expect(result.values?.primaryColor).toBe(primaryColor); // the form keeps what was typed
    }
    expect(await m.db.community.count()).toBe(before);
  });

  test("only the super admin can change it, and the same rules apply", async () => {
    await login("owner_a");
    await m.users.createAdmin(slug, {}, form({ name: "Admin A", username: "adm_a", password: PASSWORD }));
    await m.db.user.update({ where: { username: "adm_a" }, data: { mustChangePassword: false } });

    await login("adm_a");
    await rejects(m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "#6d28d9" })), NOT_FOUND);
    expect(await colorOf(slug)).toBe("#1d4ed8");

    await login("owner_a");
    expect((await m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "#f5b83d" }))).error).toContain("terlalu terang");
    expect((await m.settings.setPrimaryColor(slug, {}, form({}))).error).toBe("Warna tidak valid.");
    expect(await colorOf(slug)).toBe("#1d4ed8");

    expect((await m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "6D28D9" }))).ok).toBe("Warna komunitas disimpan.");
    expect(await colorOf(slug)).toBe("#6d28d9");
  });

  test("the colour travels in a backup and comes back on restore", async () => {
    const response = await m.backupRoute(new Request("http://x"), params({ communitySlug: slug }));
    const text = await response.text();
    expect(JSON.parse(text).community.primaryColor).toBe("#6d28d9");

    await login("owner_c");
    await rejects(m.restoreCommunity({}, restoreForm(text, "pulih-warna")), "REDIRECT:/admin/pulih-warna");
    expect(await colorOf("pulih-warna")).toBe("#6d28d9");
  });

  test("an old backup without a colour, or with an unreadable one, restores with the default", async () => {
    await login("owner_a");
    const backup = JSON.parse(await (await m.backupRoute(new Request("http://x"), params({ communitySlug: slug }))).text());

    await register("owner_d");
    await login("owner_d");
    delete backup.community.primaryColor;
    await rejects(m.restoreCommunity({}, restoreForm(JSON.stringify(backup), "pulih-lama")), "REDIRECT:/admin/pulih-lama");
    expect(await colorOf("pulih-lama")).toBeNull();

    await register("owner_e");
    await login("owner_e");
    backup.community.primaryColor = "#ffff00";
    await rejects(m.restoreCommunity({}, restoreForm(JSON.stringify(backup), "pulih-terang")), "REDIRECT:/admin/pulih-terang");
    expect(await colorOf("pulih-terang")).toBeNull();
  });
});
