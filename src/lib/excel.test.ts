import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { toCsv, validateDatasetInput } from "./dataset";
import { buildDataset, describeColumns, guessHeaderIndex, looksLikeSpreadsheet, readWorkbook, sheetToFills, sheetToGrid } from "./excel";

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
    expect(describeColumns(grid, 0, { headerRows: 2 }).map((c) => c.name)).toEqual(["Nama", "Iuran Kebersihan", "Iuran Keamanan"]);
    expect(buildDataset(grid, 0, new Set(), { headerRows: 2 })).toEqual({
      columns: ["Nama", "Iuran Kebersihan", "Iuran Keamanan"],
      rows: [["Budi", 25000, 50000]],
      fills: [],
    });
    // With one header row the second row would be read as data.
    expect(buildDataset(grid, 0).rows.length).toBe(2);
  });
});

describe("row ranges and renamed columns", () => {
  // A members table with a summary block under it, like a treasurer's sheet:
  // title, header (row 2), members (rows 3-5), summary (rows 6-7), opening balance (row 9).
  const grid = sheetToGrid(
    readWorkbook(
      XLSX.write(
        (() => {
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet([
              ["LAPORAN KAS"],
              ["No", "Nama", "Blok", "Januari", "Februari"],
              [1, "Warga A", "A1", 5000, null],
              [2, "Warga B", "A2", null, 5000],
              [3, "Warga C", "B1", 5000, 5000],
              [null, null, "TOTAL", 10000, 10000],
              [null, null, "SALDO", 12000, 22000],
              [],
              ["SALDO AWAL", 2000],
            ]),
            "S",
          );
          return wb;
        })(),
        { type: "array", bookType: "xlsx" },
      ) as ArrayBuffer,
    ).Sheets["S"],
  );

  test("a row range turns one sheet into separate tables", () => {
    const members = buildDataset(grid, 1, new Set(), { from: 3, to: 5 });
    expect(members.rows.map((r) => r[1])).toEqual(["Warga A", "Warga B", "Warga C"]);

    const summary = buildDataset(grid, 1, new Set(), { from: 6, to: 7 });
    expect(summary.rows.map((r) => r[0])).toEqual(["TOTAL", "SALDO"]);
    // Columns with nothing in the kept rows (No, Nama) drop out by themselves.
    expect(summary.columns).toEqual(["Blok", "Januari", "Februari"]);
  });

  test("the range never reaches back into the header and the end defaults to the last row", () => {
    expect(buildDataset(grid, 1, new Set(), { from: 1 }).rows.length).toBe(6); // 3 members + 2 summary + opening balance
    expect(buildDataset(grid, 1, new Set(), { to: 5 }).rows.length).toBe(3);
    expect(buildDataset(grid, 1, new Set(), { from: 50 }).rows).toEqual([]);
  });

  test("columns can be renamed, and duplicate names are made unique", () => {
    const renamed = buildDataset(grid, 1, new Set([0, 1]), {
      from: 6,
      to: 7,
      renames: new Map([[2, "Keterangan"], [3, "Keterangan"]]),
    });
    expect(renamed.columns).toEqual(["Keterangan", "Keterangan (2)", "Februari"]);
    // Blank renames fall back to the header.
    expect(describeColumns(grid, 1, { renames: new Map([[1, "  "]]) })[1].name).toBe("Nama");
  });

  test("rows that are blank in the kept columns are dropped", () => {
    // Without "No", "Nama" and "Blok" the opening-balance row has nothing left to show.
    const table = buildDataset(grid, 1, new Set([0, 1, 2]), { from: 9 });
    expect(table.rows).toEqual([]);
  });
});

describe("pinnedColumn", () => {
  const months = ["Jan", "Feb", "Mar"];

  test("pins the first text column of a wide table, skipping a number column", async () => {
    const { pinnedColumn } = await import("./dataset");
    const columns = ["No", "Bapak", "Ibu", "Blok", ...months];
    const rows = [
      [1, "Budi", "Ani", "A1", 5000, null, 5000],
      [2, "Cici", null, "A2", null, 5000, 5000],
      [null, null, null, "TOTAL", 5000, 5000, 10000],
    ];
    expect(pinnedColumn(columns, rows)).toBe(1);
  });

  test("a summary table pins its label column", async () => {
    const { pinnedColumn } = await import("./dataset");
    const columns = ["Keterangan", ...months, "Apr", "Mei"];
    expect(pinnedColumn(columns, [["Total", 1, 2, 3, 4, 5], ["Saldo", 1, 2, 3, 4, 5]])).toBe(0);
  });

  test("narrow tables and all-number tables are left alone", async () => {
    const { pinnedColumn } = await import("./dataset");
    expect(pinnedColumn(["Nama", "Jumlah"], [["Budi", 1]])).toBe(-1);
    expect(pinnedColumn(["a", "b", "c", "d", "e"], [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]])).toBe(-1);
  });
});

describe("isIndexColumn", () => {
  test("only a running number column counts", async () => {
    const { isIndexColumn } = await import("./dataset");
    expect(isIndexColumn("No", [[1], [2], [3]], 0)).toBe(true);
    expect(isIndexColumn("No.", [[1], [null]], 0)).toBe(true);
    expect(isIndexColumn("Nomor", [[1], [2]], 0)).toBe(true);
    expect(isIndexColumn("Jumlah", [[1], [2]], 0)).toBe(false); // not named like one
    expect(isIndexColumn("No", [["A1"], [2]], 0)).toBe(false); // half text: not a running number
    // A treasurer's sheet puts one label under "No" (SALDO AKHIR ...): still narrow.
    expect(isIndexColumn("No", [[1], [2], [3], [4], ["SALDO AKHIR DES '25"]], 0)).toBe(true);
    expect(isIndexColumn("No", [[null], [null]], 0)).toBe(false);
    expect(isIndexColumn("No", [[1.5]], 0)).toBe(false);
  });
});

describe("cell fills", () => {
  // SheetJS Community Edition cannot write styles, so the worksheet is built by hand.
  const solid = (rgb: string) => ({ patternType: "solid", fgColor: { rgb } });
  const sheet = () =>
    ({
      "!ref": "A1:C4",
      A1: { t: "s", v: "Nama", s: solid("FF9900") }, // header colour
      B1: { t: "s", v: "Jumlah", s: solid("FF9900") },
      C1: { t: "s", v: "Ket", s: solid("FF9900") },
      A2: { t: "s", v: "Budi", s: solid("FFFCE5CD") }, // ARGB
      B2: { t: "n", v: 1000, s: { patternType: "solid", fgColor: { theme: 4 } } }, // theme colour: ignored
      C2: { t: "s", v: "-", s: { patternType: "none" } },
      A3: { t: "s", v: "SALDO", s: solid("ffff00") }, // lower case
      B3: { t: "n", v: 1000, s: solid("FFFFFF") }, // white is not a colour
      C3: { t: "s", v: "x", s: solid("not-a-colour") },
      A4: { t: "s", v: "Ani" },
      B4: { t: "n", v: 5 },
      C4: { t: "s", v: "y" },
    }) as XLSX.WorkSheet;

  test("only plain solid RGB fills are read, normalised to upper case", () => {
    expect(sheetToFills(sheet())).toEqual([
      ["FF9900", "FF9900", "FF9900"],
      ["FCE5CD", null, null],
      ["FFFF00", null, null],
      [null, null, null],
    ]);
  });

  test("a built dataset carries fills aligned to its rows and columns, never the header's", () => {
    const ws = sheet();
    const built = buildDataset(sheetToGrid(ws), 0, new Set([1]), { fills: sheetToFills(ws) });
    // Column "Jumlah" is excluded, so "Ket" becomes column 1.
    expect(built.columns).toEqual(["Nama", "Ket"]);
    expect(built.fills).toEqual([[0, 0, "FCE5CD"], [1, 0, "FFFF00"]]);
  });

  test("a merged range paints every cell with the colour of its top-left cell", () => {
    const ws = {
      "!ref": "A1:B2",
      "!merges": [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }],
      A1: { t: "s", v: "Blok", s: solid("A4C2F4") },
      B1: { t: "s", v: "Nama" },
      B2: { t: "s", v: "Budi" },
    } as XLSX.WorkSheet;
    expect(sheetToFills(ws).map((row) => row[0])).toEqual(["A4C2F4", "A4C2F4"]);
  });

  test("validation accepts a clean list and refuses bad colours or positions", () => {
    const base = { title: "Kas", period: "", visibility: "draft", columns: ["a", "b"], rows: [["x", 1]] };
    expect("error" in validateDatasetInput({ ...base, fills: [[0, 1, "FFFF00"]] })).toBe(false);
    expect("error" in validateDatasetInput(base)).toBe(false); // fills are optional
    for (const fills of [
      [[0, 0, "red"]],
      [[0, 0, "ffff00"]],
      [[0, 0, "FFFF00; background:url(x)"]],
      [[1, 0, "FFFF00"]], // row out of range
      [[0, 2, "FFFF00"]], // column out of range
      [[0.5, 0, "FFFF00"]],
      [[0, 0]],
      "FFFF00",
      [[0, 0, "FFFF00"], [0, 1, "FFFF00"], [0, 0, "FFFF00"]], // more than rows * columns
    ])
      expect("error" in validateDatasetInput({ ...base, fills })).toBe(true);
  });
});
