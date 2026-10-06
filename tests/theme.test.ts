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

  test("something that is not a colour is refused, a light colour is not", async () => {
    await register("owner_c");
    await login("owner_c");
    const before = await m.db.community.count();
    for (const primaryColor of ["kuning", "#fff;background:url(x)"]) {
      const result = await m.createCommunity({}, form({ name: "Bukan Warna", slug: "bukan-warna", primaryColor }));
      expect(result.error).toBe("Warna tidak valid.");
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
    expect((await m.settings.setPrimaryColor(slug, {}, form({}))).error).toBe("Warna tidak valid.");
    expect((await m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "#12" }))).error).toBe("Warna tidak valid.");
    expect(await colorOf(slug)).toBe("#1d4ed8");

    expect((await m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "6D28D9" }))).ok).toBe("Warna komunitas disimpan.");
    expect(await colorOf(slug)).toBe("#6d28d9");

    // A light yellow is the community's choice to make.
    expect((await m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "#EAB308" }))).ok).toBe("Warna komunitas disimpan.");
    expect(await colorOf(slug)).toBe("#eab308");
    await m.settings.setPrimaryColor(slug, {}, form({ primaryColor: "#6d28d9" }));
  });

  test("the colour travels in a backup and comes back on restore", async () => {
    const response = await m.backupRoute(new Request("http://x"), params({ communitySlug: slug }));
    const text = await response.text();
    expect(JSON.parse(text).community.primaryColor).toBe("#6d28d9");

    await login("owner_c");
    await rejects(m.restoreCommunity({}, restoreForm(text, "pulih-warna")), "REDIRECT:/admin/pulih-warna");
    expect(await colorOf("pulih-warna")).toBe("#6d28d9");
  });

  test("an old backup without a colour, or with an invalid one, restores with the default", async () => {
    await login("owner_a");
    const backup = JSON.parse(await (await m.backupRoute(new Request("http://x"), params({ communitySlug: slug }))).text());

    await register("owner_d");
    await login("owner_d");
    delete backup.community.primaryColor;
    await rejects(m.restoreCommunity({}, restoreForm(JSON.stringify(backup), "pulih-lama")), "REDIRECT:/admin/pulih-lama");
    expect(await colorOf("pulih-lama")).toBeNull();

    await register("owner_e");
    await login("owner_e");
    backup.community.primaryColor = "kuning";
    await rejects(m.restoreCommunity({}, restoreForm(JSON.stringify(backup), "pulih-salah")), "REDIRECT:/admin/pulih-salah");
    expect(await colorOf("pulih-salah")).toBeNull();
  });
});
