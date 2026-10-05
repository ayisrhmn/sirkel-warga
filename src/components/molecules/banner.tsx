import { Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const tones = {
  info: { box: "bg-primary-tint text-primary-dark", icon: Info },
  warning: { box: "bg-accent-tint text-accent-ink", icon: TriangleAlert },
} as const;

// A short notice above a form or page.
export function Banner({ tone = "info", icon, children }: { tone?: keyof typeof tones; icon?: LucideIcon; children: ReactNode }) {
  const Icon = icon ?? tones[tone].icon;
  return (
    <div role="status" className={cx("flex items-start gap-3 rounded-2xl p-4 text-[15px] font-medium leading-normal", tones[tone].box)}>
      <Icon aria-hidden="true" size={22} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
