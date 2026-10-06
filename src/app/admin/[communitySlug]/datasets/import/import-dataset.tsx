"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { WorkBook } from "xlsx";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Banner } from "@/components/molecules/banner";
import { Field } from "@/components/molecules/field";
import { FileInput } from "@/components/molecules/file-input";
import { FormMessage } from "@/components/molecules/form-message";
import { SegmentedControl } from "@/components/molecules/segmented-control";
import { StepCard } from "@/components/molecules/step-card";
import { VisibilityField } from "@/components/molecules/visibility-field";
import { DataTable } from "@/components/organisms/data-table";
import { cx } from "@/lib/cx";
import { formatCell, validateDatasetInput, type Visibility } from "@/lib/dataset";
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

  const multipleSheets = (workbook?.SheetNames.length ?? 0) > 1;
  // The sheet step only exists when there is more than one sheet.
  const stepNo = (n: number) => (multipleSheets ? n : n - 1);
  const picking = options.from !== undefined || options.to !== undefined;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <StepCard
        step={1}
        done={!!workbook}
        title="Pilih file Excel"
        description="File dibaca di browser kamu dan tidak diunggah. Yang disimpan hanya tabel hasilnya, setelah kamu setujui pratinjau."
      >
        <Field label="File (.xlsx, .xls, atau .csv)">
          <FileInput accept=".xlsx,.xls,.csv" hint="Maksimal 5 MB" onChange={onFile} />
        </Field>
        {!workbook && <FormMessage state={{ error }} />}
      </StepCard>

      {workbook && (
        <>
          {multipleSheets && (
            <StepCard step={2} done title="Pilih sheet" description={`File ini punya ${workbook.SheetNames.length} sheet.`}>
              <div className="flex flex-wrap gap-2">
                {workbook.SheetNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={name === sheet}
                    onClick={() => openSheet(workbook, name)}
                    className={cx(
                      "min-h-11 cursor-pointer rounded-full border-[1.5px] px-4.5 text-[15px] font-bold",
                      name === sheet ? "border-primary bg-primary-tint text-primary-dark" : "border-line-strong bg-surface text-ink hover:bg-zebra",
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </StepCard>
          )}

          <StepCard
            step={stepNo(3)}
            title="Pilih baris judul kolom"
            description="Baris di atasnya (judul laporan, dll.) tidak ikut disimpan. Bila judul kolomnya bertingkat (mis. “Iuran” di atas “Kebersihan”), pilih baris paling atas dan naikkan jumlah baris judul."
          >
            <SegmentedControl
              legend="Jumlah baris judul"
              options={["1", "2", "3"]}
              value={String(headerRows)}
              onChange={(value) => {
                setHeaderRows(Number(value));
                setExcluded(new Set());
              }}
            />
            <div className="max-h-80 overflow-auto rounded-2xl border border-line">
              <table className="w-full text-sm">
                <tbody>
                  {grid.slice(0, PICKER_ROWS).map((row, r) => (
                    <tr
                      key={r}
                      className={
                        r >= headerIndex && r < headerIndex + headerRows
                          ? "bg-accent-tint"
                          : picking
                            ? r + 1 >= (options.from ?? 0) && r + 1 <= (options.to ?? Infinity) && r >= headerIndex + headerRows
                              ? "bg-primary-tint/60"
                              : "text-muted/60"
                            : ""
                      }
                    >
                      <td className="px-3 py-2">
                        <input
                          type="radio"
                          name="header"
                          checked={r === headerIndex}
                          onChange={() => {
                            setHeaderIndex(r);
                            setExcluded(new Set());
                          }}
                          aria-label={`Baris ${r + 1} sebagai judul kolom`}
                          className="size-5 accent-primary"
                        />
                      </td>
                      <td className="px-2 py-2 text-muted">{r + 1}</td>
                      {row.slice(0, PICKER_COLUMNS).map((cell, c) => (
                        <td key={c} className="px-3 py-2 whitespace-nowrap">
                          {formatCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </StepCard>

          <StepCard
            step={stepNo(4)}
            title="Baris yang disimpan (opsional)"
            description="Kosongkan untuk menyimpan semua baris di bawah judul. Isi bila satu sheet berisi lebih dari satu tabel, mis. daftar warga di baris 3 sampai 22 dan ringkasan kas di baris 23 sampai 26. Nomor baris sesuai kolom nomor di daftar di atas. Baris yang dipilih berwarna hijau muda."
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Dari baris">
                <Input inputMode="numeric" value={fromRow} onChange={(e) => setFromRow(e.target.value)} />
              </Field>
              <Field label="Sampai baris">
                <Input inputMode="numeric" value={toRow} onChange={(e) => setToRow(e.target.value)} />
              </Field>
            </div>
          </StepCard>

          <StepCard
            step={stepNo(5)}
            title="Kolom yang disimpan"
            description="Hilangkan centang pada kolom yang tidak perlu ditampilkan, mis. nomor telepon. Nama kolom bisa diubah, mis. “Blok” menjadi “Keterangan” untuk tabel ringkasan."
          >
            <ul className="flex flex-col gap-2.5">
              {candidates.map((c) => (
                <li key={c.index} className={cx("flex items-center gap-3.5", excluded.has(c.index) && "opacity-55")}>
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
                    className="size-6 shrink-0 accent-primary"
                  />
                  <Input
                    value={renames.get(c.index) ?? c.name}
                    placeholder={c.name}
                    onChange={(e) => setRenames(new Map(renames).set(c.index, e.target.value))}
                    aria-label={`Nama kolom ${c.name}`}
                    className="min-h-11"
                  />
                </li>
              ))}
            </ul>
          </StepCard>

          <StepCard step={stepNo(6)} title="Pratinjau">
            {built.columns.length === 0 || built.rows.length === 0 ? (
              <FormMessage state={{ error: "Tidak ada data pada baris yang dipilih." }} />
            ) : (
              <>
                <p className="text-[15px] text-muted">
                  {built.rows.length} baris, {built.columns.length} kolom
                  {built.rows.length > PREVIEW_ROWS && ` (menampilkan ${PREVIEW_ROWS} baris pertama)`}
                </p>
                <DataTable columns={built.columns} rows={built.rows.slice(0, PREVIEW_ROWS)} fills={built.fills} />
              </>
            )}
          </StepCard>

          <StepCard step={stepNo(7)} title="Simpan">
            <div className="flex flex-col gap-5">
              <Field label="Judul laporan">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Periode (opsional)" hint="Mis. Oktober 2026">
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} />
              </Field>
              <VisibilityField value={visibility} onChange={setVisibility} />
              <FormMessage state={{ error }} />
              {notice && (
                <Banner>
                  {notice}{" "}
                  <Link href={`/admin/${slug}/datasets`} className="font-bold underline">
                    Lihat daftar laporan
                  </Link>
                </Banner>
              )}
              <div className="flex flex-col gap-3">
                <Button onClick={() => onSave(false)} disabled={saving} full>
                  {saving ? "Menyimpan..." : "Simpan laporan"}
                </Button>
                <Button variant="secondary" onClick={() => onSave(true)} disabled={saving} full>
                  Simpan, lalu buat laporan lain dari file ini
                </Button>
              </div>
            </div>
          </StepCard>
        </>
      )}
    </div>
  );
}
