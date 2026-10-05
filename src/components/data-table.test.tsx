import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable } from "./data-table";

const wide = {
  columns: ["No", "Nama", "Januari", "Februari", "Maret"],
  rows: [
    [1, "Bapak Robi & Ibu Vania (AH2-28)", 5000, null, 5000],
    [2, "Bapak Eko (AH3-15)", null, 5000, 1500000],
  ],
};
const render = (columns: string[], rows: (string | number | null)[][]) =>
  renderToStaticMarkup(<DataTable columns={columns} rows={rows} />);

describe("DataTable on phones", () => {
  test("a wide table keeps its table for large screens and adds one card per row for phones", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toContain("hidden md:block"); // the table is hidden on phones
    expect(html).toContain("md:hidden"); // the cards are hidden on large screens
    expect(html.match(/<details/g)?.length).toBe(2);
    expect(html).toContain("Ketuk nama untuk melihat rincian.");
    expect(html).not.toContain("Geser tabel");
  });

  test("the table keeps its pinned column edge while scrolling (separate borders, borders on the cells)", () => {
    const html = render(wide.columns, wide.rows);
    const table = html.split("<table")[1].split("</table>")[0];
    expect(table.split(">")[0]).toContain("border-separate");
    expect(table.split(">")[0]).toContain("border-spacing-0");
    // The pinned (Nama) header and cells carry their own right border.
    const pinnedCells = table.match(/<(th|td)[^>]*sticky left-0[^>]*border-r[^>]*>/g) ?? [];
    expect(pinnedCells.length).toBe(1 + wide.rows.length);
    // The header underline is on the header cells, since row borders do not exist in this model.
    expect(table).not.toContain('<tr class="border-b');
    expect(table.match(/<th[^>]*border-b/g)?.length).toBe(wide.columns.length);
  });

  test("a card shows the name and the number on top, and every other column inside", () => {
    const html = render(wide.columns, wide.rows);
    const first = html.split("<details")[1].split("</details>")[0];
    expect(first).toContain("1.");
    expect(first).toContain("Bapak Robi &amp; Ibu Vania (AH2-28)");
    // Details: each remaining column, with empty cells shown as a dash.
    for (const label of ["Januari", "Februari", "Maret"]) expect(first).toContain(`<dt class="text-neutral-600">${label}</dt>`);
    expect(first).toContain("5.000");
    expect(first).toContain(">-</dd>");
    // The name and the number are not repeated in the list.
    expect(first).not.toContain(">Nama</dt>");
    expect(first).not.toContain(">No</dt>");
  });

  test("big numbers inside a card are formatted the Indonesian way", () => {
    const second = render(wide.columns, wide.rows).split("<details")[2];
    expect(second).toContain("1.500.000");
  });

  test("the cards need no JavaScript: they are native details elements", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toContain("<summary");
    expect(html).not.toContain("onClick");
  });

  test("a narrow table stays a plain table on every screen", () => {
    const html = render(["Keterangan", "Jumlah"], [["Pemasukan", 1500000], ["Saldo", 549999.5]]);
    expect(html).not.toContain("<details");
    expect(html).not.toContain("hidden md:block");
    expect(html).not.toContain("Ketuk nama");
    expect(html).toContain("<table");
  });

  test("without a number column the first text column is the card title", () => {
    const html = render(["Keterangan", "Jan", "Feb", "Mar", "Apr"], [["TOTAL", 1, 2, 3, 4], ["SALDO", 5, 6, 7, 8]]);
    expect(html.split("<details")[1]).toContain("TOTAL");
    expect(html.split("<details")[1]).not.toContain(">Keterangan</dt>");
  });
});
