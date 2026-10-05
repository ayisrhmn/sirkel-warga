import { formatCell, isNumericCell, pinnedColumn, type DatasetCell } from "@/lib/dataset";

// Wide tables scroll sideways inside their own container, so the page itself
// never scrolls horizontally on a phone. One column that names the rows stays
// pinned at the left while the rest scrolls, so a row can always be read.
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: DatasetCell[][];
}) {
  const pinned = pinnedColumn(columns, rows);
  // Sticky cells need their own opaque background, or the cells scrolling
  // underneath show through them.
  const pin = (c: number) =>
    c === pinned ? "sticky left-0 z-10 border-r border-neutral-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]" : "";

  return (
    <div className="flex flex-col gap-2">
      {columns.length > 4 && (
        <p className="text-sm text-neutral-600 md:hidden">
          Geser tabel ke samping untuk melihat kolom lain.
        </p>
      )}
      <div className="overflow-x-auto rounded-md border border-neutral-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-300">
              {columns.map((name, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`whitespace-nowrap bg-white px-3 py-2 text-left font-medium ${pin(i)}`}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="bg-white odd:bg-neutral-100">
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`whitespace-nowrap bg-inherit px-3 py-2 ${
                      isNumericCell(cell) ? "text-right tabular-nums" : ""
                    } ${pin(c)}`}
                  >
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
