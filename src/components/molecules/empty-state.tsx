import type { ReactNode } from "react";

// What a list shows when it has no items yet.
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-line-strong px-5 py-6 text-center text-muted">{children}</p>;
}
