"use client";

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
  describeColumns,
  guessHeaderIndex,
  readWorkbook,
  sheetToGrid,
  type Grid,
} from "@/lib/excel";
import { createDataset } from "../actions";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PICKER_ROWS = 15;
const PICKER_COLUMNS = 10;
const PREVIEW_ROWS = 15;

export function ImportDataset({ slug }: { slug: string }) {
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheet, setSheet] = useState("");
  const [grid, setGrid] = useState<Grid>([]);
  const [headerIndex, setHeaderIndex] = useState(0);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("draft");
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  function openSheet(wb: WorkBook, name: string) {
    const nextGrid = sheetToGrid(wb.Sheets[name]);
    setSheet(name);
    setGrid(nextGrid);
    setHeaderIndex(guessHeaderIndex(nextGrid));
    setExcluded(new Set());
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
      const wb = readWorkbook(await file.arrayBuffer());
      if (wb.SheetNames.length === 0) throw new Error("empty");
      setWorkbook(wb);
      setTitle(file.name.replace(/\.[^.]+$/, ""));
      openSheet(wb, wb.SheetNames[0]);
    } catch {
      setError("File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.");
    }
  }

  const candidates = useMemo(() => describeColumns(grid, headerIndex), [grid, headerIndex]);
  const built = useMemo(
    () => buildDataset(grid, headerIndex, excluded),
    [grid, headerIndex, excluded],
  );

  function onSave() {
    setError("");
    const input = { title, period, visibility, columns: built.columns, rows: built.rows };
    const checked = validateDatasetInput(input);
    if ("error" in checked) {
      setError(checked.error);
      return;
    }
    startSaving(async () => {
      // Redirects to the dataset list on success; only errors come back.
      const result = await createDataset(slug, input);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Field label="1. Pilih file Excel (.xlsx, .xls, atau .csv)">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className={inputClass} />
      </Field>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Baris di atasnya (judul laporan, dll.) tidak ikut disimpan.
            </p>
            <div className="overflow-x-auto rounded-md border border-neutral-300 dark:border-neutral-700">
              <table className="w-full text-sm">
                <tbody>
                  {grid.slice(0, PICKER_ROWS).map((row, r) => (
                    <tr
                      key={r}
                      className={r === headerIndex ? "bg-yellow-100 dark:bg-yellow-900/40" : ""}
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
            <h3 className="font-medium">4. Kolom yang disimpan</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Hilangkan centang pada kolom yang tidak perlu ditampilkan, mis.
              nomor telepon.
            </p>
            <ul className="flex flex-col gap-1">
              {candidates.map((c) => (
                <li key={c.index}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!excluded.has(c.index)}
                      onChange={(e) => {
                        const next = new Set(excluded);
                        if (e.target.checked) next.delete(c.index);
                        else next.add(c.index);
                        setExcluded(next);
                      }}
                    />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="font-medium">5. Pratinjau</h3>
            {built.columns.length === 0 || built.rows.length === 0 ? (
              <p className={errorClass}>Tidak ada data di bawah baris judul yang dipilih.</p>
            ) : (
              <>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {built.rows.length} baris, {built.columns.length} kolom
                  {built.rows.length > PREVIEW_ROWS && ` (menampilkan ${PREVIEW_ROWS} baris pertama)`}
                </p>
                <DataTable columns={built.columns} rows={built.rows.slice(0, PREVIEW_ROWS)} />
              </>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-medium">6. Simpan</h3>
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
            <button onClick={onSave} disabled={saving} className={buttonClass}>
              {saving ? "Menyimpan..." : "Simpan laporan"}
            </button>
          </section>
        </>
      )}
      {!workbook && error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
