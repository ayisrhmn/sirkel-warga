import * as XLSX from "xlsx";
import type { DatasetCell } from "@/lib/dataset";

// Rows of cell values, rectangular, with null for empty cells.
export type Grid = DatasetCell[][];

const pad = (n: number) => String(n).padStart(2, "0");

// Excel stores dates as numbers; the cell's number format says it is a date.
function dateText(serial: number): string {
  const d = XLSX.SSF.parse_date_code(serial);
  if (!d) return String(serial);
  const time = `${pad(d.H)}:${pad(d.M)}`;
  if (serial < 1) return time;
  const date = `${pad(d.d)}/${pad(d.m)}/${d.y}`;
  return d.H || d.M ? `${date} ${time}` : date;
}

const idNumber = (value: number, decimals: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

// Digits after the decimal point in an Excel number format ("0.00%" -> 2).
const decimalsOf = (format: string) => /0\.(0+)/.exec(format)?.[1].length ?? 0;

// Percent and rupiah cells keep how the treasurer sees them: 0.25 with a
// percent format is "25%", 1500000 with an Rp format is "Rp 1.500.000". They
// become text, because a table of numbers cannot say "Rp" or "%" by itself.
function formattedNumber(value: number, format: string | undefined): string | null {
  if (!format) return null;
  if (format.includes("%")) return `${idNumber(value * 100, decimalsOf(format))}%`;
  if (/Rp|IDR/i.test(format)) {
    const amount = idNumber(Math.abs(value), decimalsOf(format));
    return `${value < 0 ? "-" : ""}Rp ${amount}`;
  }
  return null;
}

// Cached results are read for formulas (the value, never the formula text).
function cellValue(cell: XLSX.CellObject | undefined): DatasetCell {
  if (!cell) return null;
  switch (cell.t) {
    case "n": {
      const value = cell.v as number;
      if (!Number.isFinite(value)) return null;
      if (cell.z && XLSX.SSF.is_date(cell.z)) return dateText(value);
      const clean = Number(value.toPrecision(12)); // 0.1 + 0.2 -> 0.3
      return formattedNumber(clean, typeof cell.z === "string" ? cell.z : undefined) ?? clean;
    }
    case "s": {
      const text = String(cell.v ?? "").trim();
      return text === "" ? null : text;
    }
    case "b":
      return cell.v ? "Ya" : "Tidak";
    case "e":
      return typeof cell.w === "string" ? cell.w : "#ERROR";
    default:
      return null;
  }
}

const MAX_CELLS = 1_000_000;

// The real extent of the data. `!ref` can claim a huge range on messy files.
function usedRange(ws: XLSX.WorkSheet) {
  let minR = Infinity, minC = Infinity, maxR = -1, maxC = -1;
  for (const key of Object.keys(ws)) {
    if (key.startsWith("!")) continue;
    const { r, c } = XLSX.utils.decode_cell(key);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }
  return maxR < 0 ? null : { minR, minC, maxR, maxC };
}

// Sheet to grid. Merged ranges repeat their top-left value in every cell.
export function sheetToGrid(ws: XLSX.WorkSheet): Grid {
  const used = usedRange(ws);
  if (!used) return [];
  const { minR, minC, maxR, maxC } = used;
  if ((maxR - minR + 1) * (maxC - minC + 1) > MAX_CELLS)
    throw new Error("Sheet terlalu besar.");

  const merged = new Map<string, XLSX.CellObject>();
  for (const range of ws["!merges"] ?? []) {
    const origin = ws[XLSX.utils.encode_cell(range.s)];
    if (!origin) continue;
    for (let r = range.s.r; r <= range.e.r; r++)
      for (let c = range.s.c; c <= range.e.c; c++)
        if (r !== range.s.r || c !== range.s.c)
          merged.set(XLSX.utils.encode_cell({ r, c }), origin);
  }

  const grid: Grid = [];
  for (let r = minR; r <= maxR; r++) {
    const row: DatasetCell[] = [];
    for (let c = minC; c <= maxC; c++) {
      const address = XLSX.utils.encode_cell({ r, c });
      row.push(cellValue(merged.get(address) ?? ws[address]));
    }
    grid.push(row);
  }
  return grid;
}

// SheetJS reads any unknown file as CSV text, so a renamed text file would be
// accepted as a one-cell sheet. Check the signature of real Excel files first:
// .xlsx is a zip ("PK\x03\x04"), .xls is an OLE2 document.
export function looksLikeSpreadsheet(bytes: Uint8Array, fileName: string) {
  if (/\.csv$/i.test(fileName)) return true;
  const startsWith = (...signature: number[]) => signature.every((b, i) => bytes[i] === b);
  return startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0xd0, 0xcf, 0x11, 0xe0);
}

export function readWorkbook(data: ArrayBuffer | Uint8Array) {
  // cellNF keeps number formats, needed to recognise date cells.
  return XLSX.read(data, { type: "array", cellNF: true });
}

const isEmpty = (v: DatasetCell) => v === null;

// The first row that looks like a header: several different filled cells,
// mostly text. A merged title banner repeats one value, so it is skipped.
export function guessHeaderIndex(grid: Grid): number {
  const rows = grid.slice(0, 15);
  const filled = rows.map((row) => row.filter((v) => !isEmpty(v)));
  const widest = Math.max(0, ...filled.map((cells) => cells.length));
  const index = filled.findIndex((cells) => {
    const texts = cells.filter((v) => typeof v === "string").length;
    return (
      new Set(cells).size >= 2 &&
      cells.length >= Math.ceil(widest / 2) &&
      texts >= cells.length * 0.6
    );
  });
  return Math.max(index, 0);
}

export type ColumnInfo = { index: number; name: string };

export type BuildOptions = {
  // How many rows the header spans (1 to 3). "Iuran" over "Kebersihan" becomes
  // "Iuran Kebersihan"; repeated parts (a merged cell) are written once.
  headerRows?: number;
  // First and last sheet row (1-based, as shown in the row picker) to keep.
  // Lets one sheet become several tables, e.g. members and a summary.
  from?: number;
  to?: number;
  // New names for columns, by original column index.
  renames?: ReadonlyMap<number, string>;
};

function headerName(grid: Grid, headerIndex: number, headerRows: number, c: number) {
  const parts: string[] = [];
  for (let r = headerIndex; r < headerIndex + headerRows; r++) {
    const text = String(grid[r]?.[c] ?? "").trim();
    if (text && text !== parts[parts.length - 1]) parts.push(text);
  }
  return parts.join(" ");
}

// The rows below the header that are kept (blank ones are dropped later).
function dataRows(grid: Grid, headerIndex: number, options: BuildOptions) {
  const start = headerIndex + (options.headerRows ?? 1);
  const first = Math.max(start, (options.from ?? 0) - 1);
  return grid.slice(first, options.to ?? grid.length);
}

// Columns that have a header or any data in the kept rows, with unique names.
export function describeColumns(
  grid: Grid,
  headerIndex: number,
  options: BuildOptions = {},
): ColumnInfo[] {
  const headerRows = options.headerRows ?? 1;
  const body = dataRows(grid, headerIndex, options);
  const width = Math.max(0, ...grid.map((row) => row.length));
  // Without a range, a column with a header but no data yet (next month's
  // column) is kept. With a range, the header may belong to another block of
  // the sheet, so only columns that have data in the kept rows stay.
  const rangeChosen = options.from !== undefined || options.to !== undefined;
  const seen = new Map<string, number>();
  const columns: ColumnInfo[] = [];

  for (let c = 0; c < width; c++) {
    const original = headerName(grid, headerIndex, headerRows, c);
    const hasData = body.some((row) => !isEmpty(row[c] ?? null));
    if (!hasData && (rangeChosen || !original)) continue;
    const base = options.renames?.get(c)?.trim() || original || `Kolom ${c + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    columns.push({ index: c, name: count === 1 ? base : `${base} (${count})` });
  }
  return columns;
}

// The final table: the chosen header, then every non-blank kept row below it.
// Columns and values are taken as they are in the sheet.
export function buildDataset(
  grid: Grid,
  headerIndex: number,
  excluded: ReadonlySet<number> = new Set(),
  options: BuildOptions = {},
) {
  const columns = describeColumns(grid, headerIndex, options).filter(
    (c) => !excluded.has(c.index),
  );
  const rows = dataRows(grid, headerIndex, options)
    .map((row) => columns.map((c) => row[c.index] ?? null))
    .filter((row) => row.some((v) => !isEmpty(v)));
  return { columns: columns.map((c) => c.name), rows };
}
