import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const tones = {
  green: "bg-primary-tint text-primary-dark",
  amber: "bg-accent-tint text-accent-ink",
  accent: "bg-accent text-ink",
  gray: "bg-zinc-200/70 text-zinc-700",
  red: "bg-danger-tint text-danger",
  dark: "bg-white/15 text-white",
} as const;

export type ChipTone = keyof typeof tones;

// A small status label, e.g. "Publik" or "Dilindungi".
export function Chip({ tone = "gray", icon: Icon, children }: { tone?: ChipTone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className={cx("inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold", tones[tone])}>
      {Icon && <Icon aria-hidden="true" size={14} />}
      {children}
    </span>
  );
}
