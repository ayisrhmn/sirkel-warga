import {
  fillLookup,
  formatCell,
  isIndexColumn,
  isNegativeCell,
  isNumericCell,
  pinnedColumn,
  readableTextColor,
  type DatasetCell,
  type DatasetFill,
} from "@/lib/dataset";

// Wide tables scroll sideways inside their own container, so the page itself
// never scrolls horizontally on a phone. One column that names the rows stays
// pinned at the left while the rest scrolls, so a row can always be read.
// (A card-per-row layout for phones was tried and dropped: it hid the totals
// and made rows hard to compare.)
export function DataTable({
  columns,
  rows,
  fills,
}: {
  columns: string[];
  rows: DatasetCell[][];
  // Background colours of the original sheet, as stored with the dataset.
  fills?: readonly DatasetFill[];
}) {
  const fillAt = fillLookup(fills);
  const pinned = pinnedColumn(columns, rows);
  // A running number needs only its digits: `w-px` with no-wrap shrinks the
  // column to its content while the other columns share the rest.
  const narrow = columns.map((name, c) => isIndexColumn(name, rows, c));
  const pad = (c: number) => (narrow[c] ? "w-px px-2 text-center" : "px-3");
  // A column of amounts (most cells are numbers) is right-aligned, header and
  // numbers alike, so the header sits right above the numbers.
  const numeric = columns.map((_, c) => {
    const cells = rows.map((row) => row[c]).filter((cell) => cell !== null);
    return !narrow[c] && cells.length > 0 && cells.filter(isNumericCell).length >= cells.length * 0.6;
  });
  // Sticky cells need their own opaque background, or the cells scrolling
  // underneath show through them. Their right edge is drawn with a border, which
  // only stays with a sticky cell when the table uses `border-separate`: in the
  // default collapsed model the borders belong to the table and scroll away.
  // On a phone the pinned name column would take most of the screen (a long
  // "Bapak X & Ibu Y (AH2-28)" on one line), leaving no room for the other
  // columns. There it is fixed at 9rem and may wrap onto several lines; from md
  // up it is one line as wide as it needs. The running number is hidden on
  // phones when a name column exists: the name already identifies the row.
  const pin = (c: number) =>
    c === pinned
      ? "sticky left-0 z-10 border-r border-line shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] w-36 min-w-36 max-w-36 whitespace-normal break-words md:w-auto md:min-w-0 md:max-w-none md:whitespace-nowrap"
      : "";
  const hideOnPhone = (c: number) => (narrow[c] && pinned >= 0 && c !== pinned ? "hidden md:table-cell" : "");

  return (
    <div className="flex flex-col gap-2">
      {columns.length > 4 && (
        <p className="text-sm text-muted md:hidden">
          Geser tabel ke samping untuk melihat kolom lain.
        </p>
      )}
      {/* Full width: the table fills the page, and scrolls sideways inside its
          frame when its content is wider. */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((name, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${i === pinned ? "" : "whitespace-nowrap"} border-b border-line bg-primary-tint text-primary-dark ${pad(i)} py-3 ${narrow[i] ? "" : numeric[i] ? "text-right" : "text-left"} font-bold ${pin(i)} ${hideOnPhone(i)}`}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="bg-surface odd:bg-zebra">
                {row.map((cell, c) => {
                  const fill = fillAt.get(`${r}:${c}`);
                  const negative = isNegativeCell(cell);
                  // Red text, unless the cell has a dark background where
                  // the light text colour is the only one that reads.
                  const ink = fill ? readableTextColor(fill) : undefined;
                  const color = negative && ink !== "#ffffff" ? "#b91c1c" : ink;
                  return (
                  <td
                    key={c}
                    style={fill || color ? { backgroundColor: fill ? `#${fill}` : undefined, color } : undefined}
                    className={`${
                      c === pinned
                        ? ""
                        : narrow[c] && typeof cell !== "number"
                          ? "whitespace-normal break-words"
                          : "whitespace-nowrap"
                    } bg-inherit ${pad(c)} py-3 ${
                      narrow[c] ? "tabular-nums" : numeric[c] || isNumericCell(cell) ? "text-right tabular-nums" : ""
                    } ${pin(c)} ${hideOnPhone(c)}`}
                  >
                    {cell === null ? (
                      <span className={fill ? "opacity-60" : "text-muted/70"}>-</span>
                    ) : (
                      formatCell(cell)
                    )}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
