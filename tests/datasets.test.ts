// Integration test for importing, publishing, exporting, and protecting
// datasets. Run with: bun run test
import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { buildDataset, guessHeaderIndex, readWorkbook, sheetToGrid } from "../src/lib/excel";
import { form, login, m, PASSWORD, register, rejects, setupTestEnv } from "./helpers";

setupTestEnv();

const slugA = "dawis-matahari-sektor-3";
const slugB = "rt-05-melati";
const NOT_FOUND = "NOT_FOUND";

// A real .xlsx file, parsed through the same code the import screen uses.
function importable() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["IURAN OKTOBER 2026"],
    [],
    ["Nama", "Status", "Telepon", "Jumlah"],
    ["Budi", "Lunas", "0812", 50000],
    ["Ani", "Belum", "0813", 0],
    ["Total", null, null, null],
  ]);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  ws["D6"] = { t: "n", f: "SUM(D4:D5)", v: 50000 };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Iuran");
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  const grid = sheetToGrid(readWorkbook(bytes).Sheets["Iuran"]);
  const header = guessHeaderIndex(grid);
  // The admin unticks the phone column (index 2) in the import screen.
  return { header, ...buildDataset(grid, header, new Set([2])) };
}

const asParams = (params: Record<string, string>) => ({ params: Promise.resolve(params) }) as never;
const community = async (slug: string) => m.db.community.findUniqueOrThrow({ where: { slug } });

let datasetId = "";

describe("import", () => {
  test("setup: two communities and an admin in A", async () => {
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
  });

  test("an admin imports a parsed Excel file as a draft", async () => {
    await login("adm_a");
    const parsed = importable();
    expect(parsed.header).toBe(2);
    expect(parsed.columns).toEqual(["Nama", "Status", "Jumlah"]);

    await rejects(
      m.datasets.createDataset(slugA, { title: "Iuran Oktober", period: "Oktober 2026", visibility: "draft", columns: parsed.columns, rows: parsed.rows }),
      `REDIRECT:/admin/${slugA}/datasets`,
    );
    const stored = await m.db.dataset.findFirstOrThrow({ where: { title: "Iuran Oktober" } });
    datasetId = stored.id;
    expect(stored.visibility).toBe("draft");
    expect(stored.columns).toEqual(["Nama", "Status", "Jumlah"]);
    expect(stored.rows).toEqual([["Budi", "Lunas", 50000], ["Ani", "Belum", 0], ["Total", null, 50000]]);
  });

  test("malformed or oversized payloads are rejected on the server", async () => {
    const ok = { title: "Valid", period: "", visibility: "draft", columns: ["a"], rows: [["x"]] };
    for (const bad of [
      "not an object",
      { ...ok, title: "x" },
      { ...ok, visibility: "everyone" },
      { ...ok, rows: [["x", "extra"]] },
      { ...ok, rows: [[{ evil: 1 }]] },
      { ...ok, rows: Array.from({ length: 1001 }, () => ["x"]) },
    ]) {
      expect((await m.datasets.createDataset(slugA, bad)).error).toBeDefined();
    }
    expect(await m.db.dataset.count()).toBe(1);
  });
});

describe("visibility", () => {
  test("a draft is invisible to the public", async () => {
    const c = await community(slugA);
    expect(await m.getPublicDataset(c, datasetId)).toBeNull();
    expect((await m.getPublicContent(c)).datasets).toEqual([]);
  });

  test("a protected dataset is listed but its rows are never loaded", async () => {
    const c = await community(slugA);
    const result = await m.datasets.updateDatasetMeta(slugA, datasetId, {}, form({ title: "Iuran Oktober", period: "Oktober 2026", visibility: "protected" }));
    expect(result.ok).toBeDefined();

    const dataset = await m.getPublicDataset(c, datasetId);
    expect(dataset?.visibility).toBe("protected");
    expect(dataset && "rows" in dataset).toBe(false);
    expect(dataset && "columns" in dataset).toBe(false);
    expect((await m.getPublicContent(c)).datasets).toEqual([
      { id: datasetId, title: "Iuran Oktober", period: "Oktober 2026", visibility: "protected" },
    ]);
  });

  test("a public dataset exposes its table", async () => {
    const c = await community(slugA);
    await m.datasets.updateDatasetMeta(slugA, datasetId, {}, form({ title: "Iuran Oktober", period: "Oktober 2026", visibility: "public" }));
    const dataset = await m.getPublicDataset(c, datasetId);
    expect(dataset?.visibility === "public" && dataset.rows.length).toBe(3);
  });

  test("invalid metadata is rejected", async () => {
    expect((await m.datasets.updateDatasetMeta(slugA, datasetId, {}, form({ title: "ab", period: "", visibility: "public" }))).error).toBeDefined();
    expect((await m.datasets.updateDatasetMeta(slugA, datasetId, {}, form({ title: "Valid", period: "", visibility: "hidden" }))).error).toBeDefined();
  });
});

describe("export", () => {
  test("members can download a CSV and a JSON backup", async () => {
    const csv = await m.exportCsv(new Request("http://x"), asParams({ communitySlug: slugA, id: datasetId }));
    expect(csv.headers.get("content-disposition")).toContain("iuran-oktober.csv");
    expect(await csv.text()).toBe("﻿Nama,Status,Jumlah\r\nBudi,Lunas,50000\r\nAni,Belum,0\r\nTotal,,50000\r\n");

    const backup = await (await m.exportAll(new Request("http://x"), asParams({ communitySlug: slugA }))).json();
    expect(backup.community.slug).toBe(slugA);
    expect(backup.datasets.length).toBe(1);
    expect(backup.datasets[0].rows.length).toBe(3);
  });
});

describe("isolation", () => {
  test("another community's owner cannot read, change, export, or delete the dataset", async () => {
    await login("owner_b");
    const form1 = form({ title: "Hijacked", period: "", visibility: "public" });

    for (const slug of [slugA, slugB]) {
      await rejects(m.datasets.updateDatasetMeta(slug, datasetId, {}, form1), NOT_FOUND);
      await rejects(m.datasets.deleteDataset(slug, datasetId), NOT_FOUND);
      await rejects(Promise.resolve(m.exportCsv(new Request("http://x"), asParams({ communitySlug: slug, id: datasetId }))), NOT_FOUND);
    }
    await rejects(Promise.resolve(m.exportAll(new Request("http://x"), asParams({ communitySlug: slugA }))), NOT_FOUND);
    await rejects(m.datasets.createDataset(slugA, { title: "Evil", period: "", visibility: "public", columns: ["a"], rows: [["x"]] }) as Promise<unknown>, NOT_FOUND);
    await rejects(m.datasets.deleteDataset(slugB, "not-a-uuid"), NOT_FOUND);

    // The dataset id is valid but belongs to A: B's public lookup finds nothing.
    expect(await m.getPublicDataset(await community(slugB), datasetId)).toBeNull();
    expect((await m.db.dataset.findUniqueOrThrow({ where: { id: datasetId } })).title).toBe("Iuran Oktober");
    expect(await m.db.dataset.count({ where: { title: "Evil" } })).toBe(0);
  });

  test("B's own backup contains none of A's data", async () => {
    const backup = await (await m.exportAll(new Request("http://x"), asParams({ communitySlug: slugB }))).json();
    expect(backup.datasets).toEqual([]);
  });
});

describe("delete", () => {
  test("an admin can delete a dataset", async () => {
    await login("adm_a");
    await rejects(m.datasets.deleteDataset(slugA, datasetId), `REDIRECT:/admin/${slugA}/datasets`);
    expect(await m.db.dataset.count()).toBe(0);
    await rejects(m.datasets.deleteDataset(slugA, datasetId), NOT_FOUND);
  });
});

describe("one sheet, two reports", () => {
  // Shaped like a treasurer's sheet: title, header (row 2), members (rows 3-5),
  // summary (rows 6-8) with its labels in the "Blok" column, opening balance (row 10).
  const grid = (() => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["LAPORAN KAS"],
      ["No", "Bapak", "Ibu", "Blok", "Januari", "Februari"],
      [1, "Warga Satu", "Ibu Satu", "AH2-28", 5000, null],
      [2, "Warga Dua", null, "AH3-8", null, 5000],
      [3, "Warga Tiga", "Ibu Tiga", "AH7-19", 5000, 5000],
      [null, null, null, "TOTAL", 10000, 10000],
      [null, null, null, "PENGELUARAN", 4000, null],
      [null, null, null, "SALDO", 6000, 16000],
      [],
      ["SALDO AWAL", 2000],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    return sheetToGrid(readWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer).Sheets["Sheet1"]);
  })();

  test("members stay protected while the summary of the same file goes public", async () => {
    await login("adm_a");
    const members = buildDataset(grid, 1, new Set(), { from: 3, to: 5 });
    const summary = buildDataset(grid, 1, new Set(), { from: 6, to: 8, renames: new Map([[3, "Keterangan"]]) });
    expect(summary.columns).toEqual(["Keterangan", "Januari", "Februari"]);
    expect(members.rows.length).toBe(3);
    expect(summary.rows.length).toBe(3);

    // "Stay" keeps the import screen open: no redirect, just a confirmation.
    expect(await m.datasets.createDataset(slugA, { title: "Rincian iuran", period: "2026", visibility: "protected", ...members }, true)).toEqual({ saved: true });
    expect(await m.datasets.createDataset(slugA, { title: "Ringkasan kas", period: "2026", visibility: "public", ...summary }, true)).toEqual({ saved: true });

    const c = await community(slugA);
    const listed = (await m.getPublicContent(c)).datasets;
    expect(listed.map((d) => `${d.title}:${d.visibility}`).sort()).toEqual(["Rincian iuran:protected", "Ringkasan kas:public"]);

    // What a visitor can get: the summary table, and for the member table nothing but its title.
    const publicIds = listed.map((d) => d.id);
    const visible = await Promise.all(publicIds.map((id) => m.getPublicDataset(c, id)));
    const everything = JSON.stringify([listed, visible]);
    expect(everything).toContain("SALDO");
    for (const secret of ["Warga Satu", "Warga Dua", "Ibu Tiga", "AH7-19"]) expect(everything).not.toContain(secret);
  });

  test("without stay, saving still goes back to the list", async () => {
    const members = buildDataset(grid, 1, new Set(), { from: 3, to: 5 });
    await rejects(
      m.datasets.createDataset(slugA, { title: "Rincian lagi", period: "", visibility: "draft", ...members }),
      `REDIRECT:/admin/${slugA}/datasets`,
    );
  });
});
