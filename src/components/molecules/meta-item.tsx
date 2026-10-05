import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// A small icon + text pair (date, time, place) used in card meta lines.
export function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
      <Icon aria-hidden="true" size={16} className="shrink-0" />
      {children}
    </span>
  );
}
