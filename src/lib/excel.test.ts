import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { toCsv, validateDatasetInput } from "./dataset";
import { buildDataset, describeColumns, guessHeaderIndex, looksLikeSpreadsheet, readWorkbook, sheetToGrid } from "./excel";

// A treasurer-style sheet: banner title (merged), header on row 3, an empty
// column, a duplicate header, a vertical merge, a formula, a date, a blank
// row in the middle, and a total row at the bottom.
function messyWorkbook() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["LAPORAN KAS RT 05", null, null, null, null],
    [],
    ["Nama", "Blok", null, "Jumlah", "Jumlah"],
    ["Budi", "A", null, 100000, 5],
    ["Ani", null, null, 200000.1 + 0.2, 7],
    [],
    ["Cici", "B", null, 50, 1],
    ["Total", null, null, null, null],
  ]);
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // banner
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // "A" spans Budi and Ani
  ];
  // Formula cell: only the cached result must be read.
  ws["D8"] = { t: "n", f: "SUM(D4:D7)", v: 300050.3 };
  ws["E8"] = { t: "n", f: "SUM(E4:E7)", v: 13 };
  // A date: a number with a date format.
  ws["C4"] = { t: "n", v: 45000, z: "dd/mm/yyyy" };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kas");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["x"]]), "Lain");
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return readWorkbook(bytes);
}

describe("excel parsing", () => {
  const wb = messyWorkbook();
  const grid = sheetToGrid(wb.Sheets["Kas"]);

  test("merged cells repeat their value, formulas give their cached result", () => {
    expect(grid[0].every((v) => v === "LAPORAN KAS RT 05")).toBe(true);
    expect(grid[4][1]).toBe("A"); // Ani sits under the vertical merge
    expect(grid[7][3]).toBe(300050.3);
    expect(grid[7][4]).toBe(13);
  });

  test("numbers lose float noise and date cells become dd/mm/yyyy", () => {
    expect(grid[4][3]).toBe(200000.3);
    expect(grid[3][2]).toBe("15/03/2023");
  });

  test("the header row is guessed past the banner and the blank line", () => {
    expect(guessHeaderIndex(grid)).toBe(2);
  });

  test("empty columns are dropped and duplicate headers get a suffix", () => {
    const names = describeColumns(grid, 2).map((c) => c.name);
    expect(names).toEqual(["Nama", "Blok", "Kolom 3", "Jumlah", "Jumlah (2)"]);
  });

  test("buildDataset drops blank rows, keeps the total row, and honours excluded columns", () => {
    const { columns, rows } = buildDataset(grid, 2, new Set([4]));
    expect(columns).toEqual(["Nama", "Blok", "Kolom 3", "Jumlah"]);
    expect(rows.length).toBe(4); // Budi, Ani, Cici, Total (blank row dropped)
    expect(rows.at(-1)).toEqual(["Total", null, null, 300050.3]);
  });

  test("a sheet claiming a huge range is read by its real extent", () => {
    const ws = XLSX.utils.aoa_to_sheet([["a", "b"], [1, 2]]);
    ws["!ref"] = "A1:XFD1048576";
    expect(sheetToGrid(ws)).toEqual([["a", "b"], [1, 2]]);
  });
});

describe("file detection", () => {
  const bytes = (...values: number[]) => new Uint8Array(values);
  const text = new TextEncoder().encode("ini cuma teks");

  test("real .xlsx and .xls files pass, a renamed text file does not", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["a"]]), "S");
    const xlsx = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    expect(looksLikeSpreadsheet(new Uint8Array(xlsx), "a.xlsx")).toBe(true);
    expect(looksLikeSpreadsheet(bytes(0xd0, 0xcf, 0x11, 0xe0, 0), "a.xls")).toBe(true);
    expect(looksLikeSpreadsheet(text, "bukan-excel.xlsx")).toBe(false);
    expect(looksLikeSpreadsheet(text, "data.csv")).toBe(true);
  });
});

describe("dataset validation and CSV", () => {
  const ok = { title: "Kas Oktober", period: "Oktober 2026", visibility: "draft", columns: ["Nama", "Jumlah"], rows: [["Budi", 1000]] };

  test("accepts a well-formed dataset and trims text", () => {
    const result = validateDatasetInput({ ...ok, title: "  Kas Oktober  ", period: "  " });
    expect("data" in result && result.data.title).toBe("Kas Oktober");
    expect("data" in result && result.data.period).toBeNull();
  });

  test("rejects malformed input", () => {
    for (const bad of [
      null,
      { ...ok, title: "ab" },
      { ...ok, visibility: "everyone" },
      { ...ok, columns: [] },
      { ...ok, rows: [] },
      { ...ok, rows: [["Budi"]] },
      { ...ok, rows: [["Budi", { evil: true }]] },
      { ...ok, rows: [["Budi", Number.NaN]] },
      { ...ok, rows: [["x".repeat(301), 1]] },
      { ...ok, columns: Array.from({ length: 31 }, (_, i) => `c${i}`), rows: [Array(31).fill(1)] },
      { ...ok, rows: Array.from({ length: 1001 }, () => ["a", 1]) },
    ]) {
      expect("error" in validateDatasetInput(bad)).toBe(true);
    }
  });

  test("CSV escapes quotes and neutralises spreadsheet formulas", () => {
    const csv = toCsv(["Nama", "Catatan"], [["Budi, S.", "dia bilang \"ok\""], ["=HYPERLINK(\"x\")", -5]]);
    expect(csv).toBe('﻿Nama,Catatan\r\n"Budi, S.","dia bilang ""ok"""\r\n"\'=HYPERLINK(""x"")",-5\r\n');
  });
});

describe("number formats and grouped headers", () => {
  function sheetWith(cells: Record<string, XLSX.CellObject>, ref: string) {
    const ws: XLSX.WorkSheet = { ...cells, "!ref": ref };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "S");
    const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    return sheetToGrid(readWorkbook(bytes).Sheets["S"]);
  }

  test("percent and rupiah cells keep the way they look in Excel", () => {
    const grid = sheetWith(
      {
        A1: { t: "n", v: 0.25, z: "0%" },
        A2: { t: "n", v: 0.1234, z: "0.0%" },
        A3: { t: "n", v: 1500000, z: '"Rp"#,##0' },
        A4: { t: "n", v: 350000.5, z: '[$Rp-421] #,##0.00' },
        A5: { t: "n", v: -2500, z: '"Rp"#,##0' },
        A6: { t: "n", v: 1500000, z: "#,##0" },
        A7: { t: "n", v: 0.5 },
      },
      "A1:A7",
    );
    expect(grid.map((row) => row[0])).toEqual(["25%", "12,3%", "Rp 1.500.000", "Rp 350.000,50", "-Rp 2.500", 1500000, 0.5]);
  });

  test("a two-row header becomes one name per column", () => {
    const grid = sheetWith(
      {
        A1: { t: "s", v: "Nama" },
        B1: { t: "s", v: "Iuran" },
        C1: { t: "s", v: "Iuran" }, // a merged "Iuran" repeats across both columns
        A2: { t: "s", v: "Nama" },
        B2: { t: "s", v: "Kebersihan" },
        C2: { t: "s", v: "Keamanan" },
        A3: { t: "s", v: "Budi" },
        B3: { t: "n", v: 25000 },
        C3: { t: "n", v: 50000 },
      },
      "A1:C3",
    );
    expect(describeColumns(grid, 0, 2).map((c) => c.name)).toEqual(["Nama", "Iuran Kebersihan", "Iuran Keamanan"]);
    expect(buildDataset(grid, 0, new Set(), 2)).toEqual({
      columns: ["Nama", "Iuran Kebersihan", "Iuran Keamanan"],
      rows: [["Budi", 25000, 50000]],
    });
    // With one header row the second row would be read as data.
    expect(buildDataset(grid, 0).rows.length).toBe(2);
  });
});
