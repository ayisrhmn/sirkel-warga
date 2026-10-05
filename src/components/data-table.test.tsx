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

  test("the table is as wide as its content instead of being stretched to the page", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toContain("w-fit max-w-full overflow-x-auto"); // the frame hugs the table
    const table = html.split("<table")[1].split(">")[0];
    expect(table).toContain("w-max");
    expect(table).not.toContain("w-full");
  });

  test("a column of amounts has its header on the right, text columns on the left", () => {
    const html = render(wide.columns, wide.rows);
    for (const name of ["Januari", "Februari", "Maret"]) expect(html).toMatch(new RegExp(`<th[^>]*text-right[^>]*>${name}</th>`));
    expect(html).toMatch(/<th[^>]*text-left[^>]*>Nama<\/th>/);
    expect(html).not.toMatch(/<th[^>]*text-right[^>]*>Nama<\/th>/);
    // The running number keeps its own centred style.
    expect(html).toMatch(/<th[^>]*text-center[^>]*>No<\/th>/);
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

  test("on phones the pinned name column is capped at 9rem and wraps; from md up it is one line", () => {
    const table = render(wide.columns, wide.rows).split("<table")[1];
    const pinnedCells = table.match(/<(th|td)[^>]*sticky left-0[^>]*>/g) ?? [];
    expect(pinnedCells.length).toBe(1 + wide.rows.length);
    for (const cell of pinnedCells) {
      for (const cls of ["w-36", "min-w-36", "max-w-36", "whitespace-normal", "break-words"]) expect(cell).toContain(cls);
      for (const cls of ["md:w-auto", "md:max-w-none", "md:whitespace-nowrap"]) expect(cell).toContain(cls);
    }
    // Other columns still never wrap.
    expect(table).toMatch(/<th[^>]*whitespace-nowrap[^>]*>Januari<\/th>/);
    expect(table).not.toMatch(/<th[^>]*whitespace-nowrap[^>]*sticky/);
  });

  test("the running number is hidden on phones when a name column exists", () => {
    const html = render(wide.columns, wide.rows);
    expect(html).toMatch(/<th[^>]*hidden md:table-cell[^>]*>No<\/th>/);
    const bodyRow = html.split("<tbody>")[1].split("</tr>")[0];
    expect(bodyRow.match(/hidden md:table-cell/g)?.length).toBe(1); // only its No cell
    expect(html).not.toMatch(/<th[^>]*hidden md:table-cell[^>]*>Nama<\/th>/);
  });

  test("without a name column the running number stays visible on phones", () => {
    const html = render(["No", "Jan", "Feb", "Mar", "Apr"], [[1, 10, 20, 30, 40], [2, 11, 21, 31, 41]]);
    expect(html).not.toContain("hidden md:table-cell");
    expect(html).not.toContain("sticky");
  });

  test("a narrow table has no hint and no pinned column", () => {
    const html = render(["Keterangan", "Jumlah"], [["Pemasukan", 1500000], ["Saldo", 549999.5]]);
    expect(html).not.toContain("Geser tabel");
    expect(html).not.toContain("sticky");
  });
});
