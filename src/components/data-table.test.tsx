import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable } from "./data-table";

const wide = {
  columns: ["No", "Nama", "Januari", "Februari", "Maret"],
  rows: [
    [1, "Bapak Robi & Ibu Vania (AH2-28)", 5000, null, 5000],
    [2, "Bapak Eko (AH3-15)", null, 5000, 1500000],
    [null, "TOTAL", 5000, 5000, 6500000],
  ],
};
const render = (columns: string[], rows: (string | number | null)[][]) =>
  renderToStaticMarkup(<DataTable columns={columns} rows={rows} />);

describe("DataTable", () => {
  test("a wide table is always a table: every row and every column, totals included", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toContain("<table");
    expect(html).not.toContain("<details"); // no card layout
    expect(html.match(/<tr /g)?.length).toBe(wide.rows.length); // body rows (the header row has no class)
    expect(html).toContain("TOTAL");
    expect(html).toContain("6.500.000");
    for (const name of wide.columns) expect(html).toContain(`>${name}</th>`);
  });

  test("the container scrolls sideways and a hint appears on small screens only", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("Geser tabel ke samping untuk melihat kolom lain.");
    expect(html).toContain("md:hidden"); // the hint is for narrow screens
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

  test("a running number column is narrow and centred, the rest is not", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toMatch(/<th[^>]*w-px px-2[^>]*>No<\/th>/);
    expect(html).toMatch(/<th[^>]*px-3[^>]*>Januari<\/th>/);
  });

  test("a narrow table has no hint and no pinned column", () => {
    const html = render(["Keterangan", "Jumlah"], [["Pemasukan", 1500000], ["Saldo", 549999.5]]);
    expect(html).not.toContain("Geser tabel");
    expect(html).not.toContain("sticky");
  });
});
