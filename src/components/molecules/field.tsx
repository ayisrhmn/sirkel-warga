import type { ReactNode } from "react";

// A label wrapped around its control, with an optional hint under it.
// Wrapping (instead of htmlFor) keeps the label and control linked without ids.
export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[15px] font-semibold text-ink">
      {label}
      {children}
      {hint && <span className="text-sm font-normal leading-snug text-muted">{hint}</span>}
    </label>
  );
}
