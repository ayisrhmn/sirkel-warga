"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { WorkBook } from "xlsx";
import { DataTable } from "@/components/data-table";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import {
  formatCell,
  validateDatasetInput,
  VISIBILITIES,
  VISIBILITY_LABEL,
  type Visibility,
} from "@/lib/dataset";
import {
  buildDataset,
  type BuildOptions,
  describeColumns,
  guessHeaderIndex,
  looksLikeSpreadsheet,
  readWorkbook,
  sheetToFills,
  sheetToGrid,
  type FillGrid,
  type Grid,
} from "@/lib/excel";
import { createDataset } from "../actions";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PICKER_ROWS = 200; // all rows are listed so any block of a long sheet can be picked
const PICKER_COLUMNS = 20;
const PREVIEW_ROWS = 15;

export function ImportDataset({ slug }: { slug: string }) {
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheet, setSheet] = useState("");
  const [grid, setGrid] = useState<Grid>([]);
  const [fillGrid, setFillGrid] = useState<FillGrid>([]);
  const [headerIndex, setHeaderIndex] = useState(0);
  const [headerRows, setHeaderRows] = useState(1);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [fromRow, setFromRow] = useState("");
  const [toRow, setToRow] = useState("");
  const [renames, setRenames] = useState<Map<number, string>>(new Map());
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("draft");
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  function openSheet(wb: WorkBook, name: string) {
    const nextGrid = sheetToGrid(wb.Sheets[name]);
    setSheet(name);
    setGrid(nextGrid);
    setFillGrid(sheetToFills(wb.Sheets[name]));
    setHeaderIndex(guessHeaderIndex(nextGrid));
    setHeaderRows(1);
    setExcluded(new Set());
    setFromRow("");
    setToRow("");
    setRenames(new Map());
    setNotice("");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setWorkbook(null);
    if (file.size > MAX_FILE_BYTES) {
      setError("File terlalu besar (maksimal 5 MB).");
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!looksLikeSpreadsheet(bytes, file.name)) throw new Error("not a spreadsheet");
      const wb = readWorkbook(bytes);
      if (wb.SheetNames.length === 0) throw new Error("empty");
      setWorkbook(wb);
      setTitle(file.name.replace(/\.[^.]+$/, ""));
      openSheet(wb, wb.SheetNames[0]);
    } catch {
      setError("File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.");
    }
  }

  const options = useMemo<BuildOptions>(() => {
    const row = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text) : undefined);
    return { headerRows, from: row(fromRow), to: row(toRow), renames, fills: fillGrid };
  }, [headerRows, fromRow, toRow, renames, fillGrid]);
  const candidates = useMemo(
    () => describeColumns(grid, headerIndex, options),
    [grid, headerIndex, options],
  );
  const built = useMemo(
    () => buildDataset(grid, headerIndex, excluded, options),
    [grid, headerIndex, excluded, options],
  );

  function onSave(stay: boolean) {
    setError("");
    setNotice("");
    const input = { title, period, visibility, columns: built.columns, rows: built.rows, fills: built.fills };
    const checked = validateDatasetInput(input);
    if ("error" in checked) {
      setError(checked.error);
      return;
    }
    startSaving(async () => {
      // Without `stay` this redirects to the dataset list on success.
      const result = await createDataset(slug, input, stay);
      if (result?.error) setError(result.error);
      else if (result?.saved) {
        setNotice(`Laporan "${title}" tersimpan. Atur baris atau kolom di atas untuk laporan berikutnya, lalu simpan lagi.`);
        setTitle("");
        setVisibility("draft");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Field label="1. Pilih file Excel (.xlsx, .xls, atau .csv)">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className={inputClass} />
      </Field>
      <p className="text-sm text-neutral-600">
        File dibaca di browser kamu dan tidak diunggah. Yang disimpan hanya
        tabel hasilnya, setelah kamu setujui pratinjau.
      </p>

      {workbook && (
        <>
          {workbook.SheetNames.length > 1 && (
            <Field label="2. Pilih sheet">
              <select
                value={sheet}
                onChange={(e) => openSheet(workbook, e.target.value)}
                className={inputClass}
              >
                {workbook.SheetNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="font-medium">3. Pilih baris judul kolom</h3>
            <p className="text-sm text-neutral-600">
              Baris di atasnya (judul laporan, dll.) tidak ikut disimpan. Bila
              judul kolomnya bertingkat (mis. &ldquo;Iuran&rdquo; di atas &ldquo;Kebersihan&rdquo;),
              pilih baris paling atas dan naikkan jumlah baris judul.
            </p>
            <Field label="Jumlah baris judul">
              <select
                value={headerRows}
                onChange={(e) => {
                  setHeaderRows(Number(e.target.value));
                  setExcluded(new Set());
                }}
                className={inputClass}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <div className="max-h-80 overflow-auto rounded-md border border-neutral-300">
              <table className="w-full text-sm">
                <tbody>
                  {grid.slice(0, PICKER_ROWS).map((row, r) => (
                    <tr
                      key={r}
                      className={
                        r >= headerIndex && r < headerIndex + headerRows
                          ? "bg-yellow-100"
                          : options.from !== undefined || options.to !== undefined
                            ? r + 1 >= (options.from ?? 0) && r + 1 <= (options.to ?? Infinity) && r >= headerIndex + headerRows
                              ? "bg-green-50"
                              : "text-neutral-400"
                            : ""
                      }
                    >
                      <td className="px-2 py-1">
                        <input
                          type="radio"
                          name="header"
                          checked={r === headerIndex}
                          onChange={() => {
                            setHeaderIndex(r);
                            setExcluded(new Set());
                          }}
                          aria-label={`Baris ${r + 1} sebagai judul kolom`}
                        />
                      </td>
                      <td className="px-2 py-1 text-neutral-500">{r + 1}</td>
                      {row.slice(0, PICKER_COLUMNS).map((cell, c) => (
                        <td key={c} className="whitespace-nowrap px-2 py-1">
                          {formatCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="font-medium">4. Baris yang disimpan (opsional)</h3>
            <p className="text-sm text-neutral-600">
              Kosongkan untuk menyimpan semua baris di bawah judul. Isi bila satu
              sheet berisi lebih dari satu tabel, mis. daftar warga di baris 3
              sampai 22 dan ringkasan kas di baris 23 sampai 26. Nomor baris
              sesuai kolom nomor di daftar di atas. Baris yang dipilih berwarna
              hijau muda.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dari baris">
                <input
                  inputMode="numeric"
                  value={fromRow}
                  onChange={(e) => setFromRow(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Sampai baris">
                <input
                  inputMode="numeric"
                  value={toRow}
                  onChange={(e) => setToRow(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="font-medium">5. Kolom yang disimpan</h3>
            <p className="text-sm text-neutral-600">
              Hilangkan centang pada kolom yang tidak perlu ditampilkan, mis.
              nomor telepon. Nama kolom bisa diubah, mis. &ldquo;Blok&rdquo; menjadi
              &ldquo;Keterangan&rdquo; untuk tabel ringkasan.
            </p>
            <ul className="flex flex-col gap-1">
              {candidates.map((c) => (
                <li key={c.index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!excluded.has(c.index)}
                    onChange={(e) => {
                      const next = new Set(excluded);
                      if (e.target.checked) next.delete(c.index);
                      else next.add(c.index);
                      setExcluded(next);
                    }}
                    aria-label={`Simpan kolom ${c.name}`}
                  />
                  <input
                    value={renames.get(c.index) ?? c.name}
                    placeholder={c.name}
                    onChange={(e) => setRenames(new Map(renames).set(c.index, e.target.value))}
                    aria-label={`Nama kolom ${c.name}`}
                    className={`${inputClass} py-1`}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="font-medium">6. Pratinjau</h3>
            {built.columns.length === 0 || built.rows.length === 0 ? (
              <p className={errorClass}>Tidak ada data pada baris yang dipilih.</p>
            ) : (
              <>
                <p className="text-sm text-neutral-600">
                  {built.rows.length} baris, {built.columns.length} kolom
                  {built.rows.length > PREVIEW_ROWS && ` (menampilkan ${PREVIEW_ROWS} baris pertama)`}
                </p>
                <DataTable
                  columns={built.columns}
                  rows={built.rows.slice(0, PREVIEW_ROWS)}
                  fills={built.fills}
                />
              </>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-medium">7. Simpan</h3>
            <Field label="Judul laporan">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Periode (opsional, mis. Oktober 2026)">
              <input value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Tampilan">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className={inputClass}
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITY_LABEL[v]}
                  </option>
                ))}
              </select>
            </Field>
            {error && <p className={errorClass}>{error}</p>}
            {notice && (
              <p className="text-sm text-green-700">
                {notice}{" "}
                <Link href={`/admin/${slug}/datasets`} className="underline">
                  Lihat daftar laporan
                </Link>
              </p>
            )}
            <button onClick={() => onSave(false)} disabled={saving} className={buttonClass}>
              {saving ? "Menyimpan..." : "Simpan laporan"}
            </button>
            <button
              onClick={() => onSave(true)}
              disabled={saving}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 font-medium disabled:opacity-50"
            >
              Simpan, lalu buat laporan lain dari file ini
            </button>
          </section>
        </>
      )}
      {!workbook && error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
