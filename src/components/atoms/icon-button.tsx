import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

// An icon-only button. `label` is required: it is the accessible name and the tooltip.
export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & { icon: LucideIcon; label: string; tone?: "neutral" | "danger" }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-[1.5px] bg-surface transition-colors disabled:opacity-50",
        tone === "danger" ? "border-danger/30 text-danger hover:bg-danger-tint" : "border-line-strong text-ink hover:bg-zebra",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" size={20} />
    </button>
  );
}
