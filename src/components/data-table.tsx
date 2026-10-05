import { formatCell, isIndexColumn, isNumericCell, pinnedColumn, type DatasetCell } from "@/lib/dataset";

// Wide tables scroll sideways inside their own container, so the page itself
// never scrolls horizontally on a phone. One column that names the rows stays
// pinned at the left while the rest scrolls, so a row can always be read.
// (A card-per-row layout for phones was tried and dropped: it hid the totals
// and made rows hard to compare.)
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: DatasetCell[][];
}) {
  const pinned = pinnedColumn(columns, rows);
  // A running number needs only its digits: `w-px` with no-wrap shrinks the
  // column to its content while the other columns share the rest.
  const narrow = columns.map((name, c) => isIndexColumn(name, rows, c));
  const pad = (c: number) => (narrow[c] ? "w-px px-2 text-center" : "px-3");
  // Sticky cells need their own opaque background, or the cells scrolling
  // underneath show through them. Their right edge is drawn with a border, which
  // only stays with a sticky cell when the table uses `border-separate`: in the
  // default collapsed model the borders belong to the table and scroll away.
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
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((name, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`whitespace-nowrap border-b border-neutral-300 bg-white ${pad(i)} py-2 ${narrow[i] ? "" : "text-left"} font-medium ${pin(i)}`}
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
                    className={`${
                      narrow[c] && typeof cell !== "number" ? "whitespace-normal break-words" : "whitespace-nowrap"
                    } bg-inherit ${pad(c)} py-2 ${
                      narrow[c] ? "tabular-nums" : isNumericCell(cell) ? "text-right tabular-nums" : ""
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
