import type { ReactNode } from "react";

// One row of an admin list: what it is, how it is doing, and what you can do
// with it. `children` is for an expandable edit form under the row.
export function AdminListItem({
  lead,
  title,
  meta,
  action,
  children,
}: {
  lead?: ReactNode;
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {lead}
        <div className="min-w-0 flex-1">
          <p className="text-[17px] leading-snug font-bold text-ink">{title}</p>
          {meta && <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">{meta}</div>}
        </div>
        {action}
      </div>
      {children}
    </li>
  );
}
