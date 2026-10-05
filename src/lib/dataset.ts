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
