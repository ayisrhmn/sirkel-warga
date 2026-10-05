import { formatCell, type DatasetCell } from "@/lib/dataset";

// Wide tables scroll sideways inside their own container, so the page itself
// never scrolls horizontally on a phone.
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: DatasetCell[][];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-300 dark:border-neutral-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-300 dark:border-neutral-700">
            {columns.map((name, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-3 py-2 text-left font-medium">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="odd:bg-neutral-100 dark:odd:bg-neutral-900">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={`whitespace-nowrap px-3 py-2 ${
                    typeof cell === "number" ? "text-right tabular-nums" : ""
                  }`}
                >
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
