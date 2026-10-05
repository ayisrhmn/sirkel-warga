// Generates the sample files used by docs/QA.md into docs/qa/.
// Run with: bun scripts/make-qa-samples.ts
import { mkdirSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const OUT = "docs/qa";
mkdirSync(OUT, { recursive: true });

// Excel stores dates as days since 1899-12-30.
const serial = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86_400_000) + 25569;
const save = (name: string, wb: XLSX.WorkBook) =>
  writeFileSync(`${OUT}/${name}`, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

// 1. A treasurer-style sheet: title banner, header on row 4, vertical merges,
// formulas, dates, an empty column, a blank row, and a total row.
{
  const names = ["Budi Santoso", "Ani Wijaya", "Cici Lestari", "Dodi Prakoso", "Eka Putri", "Fajar Nugroho", "Gita Maharani", "Hendra Gunawan"];
  const rows: unknown[][] = [
    ["LAPORAN IURAN WARGA - OKTOBER 2026"],
    [],
    [],
    ["No", "Nama Warga", "Blok", null, "Telepon", "Iuran Kebersihan", "Iuran Keamanan", "Total", "Tanggal Bayar"],
  ];
  names.forEach((name, i) =>
    rows.push([i + 1, name, i < 4 ? "A" : "B", null, `0812-3456-70${i}0`, 25000, 50000, null, null]),
  );
  rows.splice(4 + 4, 0, []); // blank row in the middle of the data
  rows.push(["", "TOTAL", null, null, null, null, null, null, null]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // title banner
    { s: { r: 4, c: 2 }, e: { r: 7, c: 2 } }, // Blok A spans four rows
    { s: { r: 9, c: 2 }, e: { r: 12, c: 2 } }, // Blok B spans four rows
  ];
  const first = 5;
  const last = 13; // spreadsheet rows of data (1-based), including the blank row
  for (let r = first; r <= last; r++) {
    if (r === 9) continue; // the blank row
    ws[`H${r}`] = { t: "n", f: `F${r}+G${r}`, v: 75000 };
  }
  // Paid on different days; unpaid rows stay empty.
  [0, 1, 2, 4, 5, 6].forEach((i) => {
    const r = first + i + (i >= 4 ? 1 : 0);
    ws[`I${r}`] = { t: "n", v: serial(`2026-10-0${i + 1}`), z: "dd/mm/yyyy" };
  });
  ws[`F${last + 1}`] = { t: "n", f: "SUM(F5:F13)", v: 200000 };
  ws[`G${last + 1}`] = { t: "n", f: "SUM(G5:G13)", v: 400000 };
  ws[`H${last + 1}`] = { t: "n", f: "SUM(H5:H13)", v: 600000 };
  ws["!ref"] = `A1:I${last + 1}`;

  const notes = XLSX.utils.aoa_to_sheet([["Catatan bendahara"], ["Iuran dibayar paling lambat tanggal 10."]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Iuran Oktober");
  XLSX.utils.book_append_sheet(wb, notes, "Catatan");
  save("1-iuran-oktober-berantakan.xlsx", wb);
}

// 2. A clean summary: the kind of sheet that is safe to make public.
{
  const ws = XLSX.utils.aoa_to_sheet([
    ["Keterangan", "Jumlah (Rp)"],
    ["Pemasukan iuran", 1500000],
    ["Pengeluaran kebersihan", 350000.5],
    ["Pengeluaran keamanan", 600000],
  ]);
  ws["A5"] = { t: "s", v: "Saldo" };
  ws["B5"] = { t: "n", f: "B2-B3-B4", v: 549999.5 };
  ws["!ref"] = "A1:B5";
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ringkasan");
  save("2-ringkasan-kas.xlsx", wb);
}

// 3. Too many rows (limit is 1000).
{
  const rows: unknown[][] = [["No", "Nama", "Jumlah"]];
  for (let i = 1; i <= 1200; i++) rows.push([i, `Warga ${i}`, i * 1000]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Data");
  save("3-terlalu-banyak-baris.xlsx", wb);
}

// 4. Too many columns (limit is 30): 35 columns, a few rows.
{
  const header = Array.from({ length: 35 }, (_, i) => `Kolom ${i + 1}`);
  const rows = [header, ...Array.from({ length: 3 }, (_, r) => header.map((_, c) => (r + 1) * (c + 1)))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Lebar");
  save("4-terlalu-banyak-kolom.xlsx", wb);
}

// 6. A two-row header (a merged "Iuran" over two columns), rupiah and percent
// formats. Header rows 1-2, data from row 3.
{
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nama", "Blok", "Iuran", null, "Persen bayar"],
    [null, null, "Kebersihan", "Keamanan", null],
    ["Budi Santoso", "A", 25000, 50000, 1],
    ["Ani Wijaya", "A", 25000, 50000, 0.5],
    ["Cici Lestari", "B", 25000, 50000, 0.25],
  ]);
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Nama spans both header rows
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Blok too
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Iuran spans two columns
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // Persen bayar
  ];
  for (const r of [3, 4, 5]) {
    ws[`C${r}`].z = '"Rp"#,##0';
    ws[`D${r}`].z = '"Rp"#,##0';
    ws[`E${r}`].z = "0%";
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Iuran bertingkat");
  save("6-header-bertingkat.xlsx", wb);
}

// 7. A monthly cash sheet shaped like a real treasurer's file, with made-up
// names: title row, header on row 2, 20 members (rows 3-22) with a payment per
// month, a summary block (rows 23-26) whose labels sit in the "Blok" column, and
// the opening balance on row 28. One sheet, two reports: members (protected) and
// the summary (public).
{
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"].map((m) => `${m} '26`);
  const rows: unknown[][] = [["LAPORAN KAS CONTOH"], ["No", "Bapak", "Ibu", "Blok", ...months]];
  for (let i = 1; i <= 20; i++) {
    rows.push([i, `Warga ${i}`, i % 4 === 0 ? null : `Ibu ${i}`, `AH${1 + (i % 8)}-${i + 10}`, ...months.map((_, m) => ((i + m) % 3 === 0 ? null : 5000))]);
  }
  rows.push([null, null, null, "TOTAL", ...months.map(() => null)]);
  rows.push([null, null, null, "PENGELUARAN", 200000, null, 150000, 169000, null, null]);
  rows.push([null, null, null, "PEMASUKAN", 120000, null, null, 75000, null, null]);
  rows.push([null, null, null, "SALDO", ...months.map(() => null)]);
  rows.push([]);
  rows.push(["SALDO AKHIR DES '25", 72000]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const cols = "EFGHIJ";
  const fmt = "#,##0;(#,##0)";
  cols.split("").forEach((col, m) => {
    const total = rows.slice(2, 22).reduce((sum, r) => sum + (Number(r[4 + m]) || 0), 0);
    ws[`${col}23`] = { t: "n", f: `SUM(${col}3:${col}22)`, v: total, z: fmt };
    const prev = m === 0 ? "B28" : `${cols[m - 1]}26`;
    const spend = Number(rows[23][4 + m]) || 0;
    const income = Number(rows[24][4 + m]) || 0;
    const before = m === 0 ? 72000 : (ws[`${cols[m - 1]}26`].v as number);
    ws[`${col}26`] = { t: "n", f: `${prev}+${col}23+${col}25-${col}24`, v: before + total + income - spend, z: fmt };
  });
  for (let r = 3; r <= 22; r++) for (const col of cols) if (ws[`${col}${r}`]) ws[`${col}${r}`].z = fmt;
  ws["!ref"] = "A1:J1000"; // like the real file, which claims a huge range
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  save("7-kas-bulanan-contoh.xlsx", wb);
}

// 5. Not a spreadsheet at all.
writeFileSync(`${OUT}/5-bukan-excel.xlsx`, "ini cuma teks biasa, bukan file Excel\n");

console.log(`Wrote samples to ${OUT}/`);
