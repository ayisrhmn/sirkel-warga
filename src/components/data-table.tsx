import { ChevronDown } from "lucide-react";
import { formatCell, isIndexColumn, isNumericCell, pinnedColumn, type DatasetCell } from "@/lib/dataset";

// A table with more columns than fits a phone is shown two ways:
// - from the md breakpoint up: a normal table, scrolling sideways inside its
//   own container, with the column that names the rows pinned at the left;
// - below it: one card per row. The row's name is on top and a tap opens the
//   other columns as a list (native <details>, so it needs no JavaScript).
// A narrow table (up to four columns) fits a phone as it is and stays a table.
const CARD_THRESHOLD = 4;

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
  // underneath show through them.
  const pin = (c: number) =>
    c === pinned ? "sticky left-0 z-10 border-r border-neutral-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]" : "";

  const asCards = columns.length > CARD_THRESHOLD;
  const indexCol = narrow.findIndex(Boolean);
  const titleCol = pinned >= 0 ? pinned : indexCol === 0 ? Math.min(1, columns.length - 1) : 0;

  return (
    <div className="flex flex-col gap-2">
      {asCards && (
        <p className="text-sm text-neutral-600 md:hidden">Ketuk nama untuk melihat rincian.</p>
      )}

      <div
        className={`overflow-x-auto rounded-md border border-neutral-300 ${asCards ? "hidden md:block" : ""}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-300">
              {columns.map((name, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`whitespace-nowrap bg-white ${pad(i)} py-2 ${narrow[i] ? "" : "text-left"} font-medium ${pin(i)}`}
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

      {asCards && (
        <ul className="flex flex-col gap-2 md:hidden">
          {rows.map((row, r) => {
            const title = formatCell(row[titleCol] ?? null);
            const number = indexCol >= 0 ? formatCell(row[indexCol] ?? null) : "";
            return (
              <li key={r}>
                <details className="group rounded-md border border-neutral-300 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="font-medium">
                      {number && <span className="mr-1 text-neutral-500">{number}.</span>}
                      {title || "-"}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <dl className="flex flex-col border-t border-neutral-200 px-3 py-2 text-sm">
                    {columns.map((name, c) =>
                      c === titleCol || c === indexCol ? null : (
                        <div key={c} className="flex justify-between gap-4 py-1">
                          <dt className="text-neutral-600">{name}</dt>
                          <dd className={`text-right ${row[c] === null ? "text-neutral-400" : "tabular-nums"}`}>
                            {row[c] === null ? "-" : formatCell(row[c])}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
