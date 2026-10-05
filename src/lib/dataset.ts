export type DatasetCell = string | number | null;

export const DATASET_LIMITS = {
  maxRows: 1000,
  maxColumns: 30,
  maxCellLength: 300,
  maxBytes: 3_000_000,
} as const;

export const VISIBILITIES = ["draft", "public", "protected"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  draft: "Draft (belum tampil)",
  public: "Publik",
  protected: "Dilindungi password",
};

export type DatasetInput = {
  title: string;
  period: string | null;
  visibility: Visibility;
  columns: string[];
  rows: DatasetCell[][];
};

// Validates a dataset coming from the browser. The Excel parsing happens
// client-side, so nothing about its shape can be trusted here.
export function validateDatasetInput(
  input: unknown,
): { error: string } | { data: DatasetInput } {
  if (typeof input !== "object" || input === null) return { error: "Data tidak valid." };
  const { title, period, visibility, columns, rows } = input as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 120)
    return { error: "Judul 3-120 karakter." };
  if (period !== null && period !== undefined && (typeof period !== "string" || period.length > 60))
    return { error: "Periode maksimal 60 karakter." };
  if (!VISIBILITIES.includes(visibility as Visibility))
    return { error: "Visibilitas tidak valid." };

  if (!Array.isArray(columns) || columns.length === 0)
    return { error: "Tabel harus punya minimal satu kolom." };
  if (columns.length > DATASET_LIMITS.maxColumns)
    return { error: `Maksimal ${DATASET_LIMITS.maxColumns} kolom. Sembunyikan kolom yang tidak perlu.` };
  if (!columns.every((c) => typeof c === "string" && c.length > 0 && c.length <= 100))
    return { error: "Nama kolom tidak valid." };

  if (!Array.isArray(rows) || rows.length === 0)
    return { error: "Tabel tidak punya baris data." };
  if (rows.length > DATASET_LIMITS.maxRows)
    return { error: `Maksimal ${DATASET_LIMITS.maxRows} baris. Pecah laporan menjadi beberapa bagian.` };

  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== columns.length)
      return { error: "Jumlah kolom pada baris data tidak sama." };
    for (const cell of row) {
      const ok =
        cell === null ||
        (typeof cell === "number" && Number.isFinite(cell)) ||
        (typeof cell === "string" && cell.length <= DATASET_LIMITS.maxCellLength);
      if (!ok)
        return { error: `Isi sel tidak valid (maksimal ${DATASET_LIMITS.maxCellLength} karakter per sel).` };
    }
  }
  if (JSON.stringify(rows).length > DATASET_LIMITS.maxBytes)
    return { error: "Data terlalu besar." };

  return {
    data: {
      title: title.trim(),
      period: typeof period === "string" && period.trim() ? period.trim() : null,
      visibility: visibility as Visibility,
      columns: columns as string[],
      rows: rows as DatasetCell[][],
    },
  };
}

const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

// Numbers, and text such as "Rp 1.500.000" or "25%", read best right-aligned.
export const isNumericCell = (cell: DatasetCell) =>
  typeof cell === "number" || (typeof cell === "string" && /^-?(Rp )?-?[\d.,]+%?$/.test(cell));

// On a phone a wide table scrolls sideways, and the names scroll away with the
// first columns. Pin one column that names the rows: the first of the first
// three whose cells are mostly text (a number column such as "No" is skipped).
// Returns -1 when the table is narrow enough to need no pinning.
export function pinnedColumn(columns: string[], rows: DatasetCell[][]): number {
  if (columns.length <= 4) return -1;
  for (let c = 0; c < Math.min(3, columns.length); c++) {
    const filled = rows.map((row) => row[c]).filter((cell) => cell !== null);
    const text = filled.filter((cell) => typeof cell === "string" && !isNumericCell(cell)).length;
    if (filled.length > 0 && filled.length >= rows.length / 2 && text >= filled.length * 0.6) return c;
  }
  return -1;
}

// A running number ("No") only needs as much width as its digits: shrink it
// instead of letting the table stretch it like every other column.
export function isIndexColumn(name: string, rows: DatasetCell[][], c: number): boolean {
  if (!/^(no|no\.|nomor|#)$/i.test(name.trim())) return false;
  const cells = rows.map((row) => row[c]).filter((cell) => cell !== null);
  return cells.every((cell) => typeof cell === "number" && Number.isInteger(cell) && cell >= 0 && cell < 10000);
}

export const formatCell = (cell: DatasetCell) =>
  cell === null ? "" : typeof cell === "number" ? numberFormat.format(cell) : cell;

// Spreadsheet apps run text starting with these characters as formulas.
const FORMULA_START = /^[=+\-@\t\r]/;

function csvField(cell: DatasetCell) {
  let text = cell === null ? "" : String(cell);
  if (typeof cell === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// UTF-8 CSV with a BOM so Excel opens accented text correctly.
export function toCsv(columns: string[], rows: DatasetCell[][]) {
  const lines = [columns, ...rows].map((row) => row.map((c) => csvField(c)).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
