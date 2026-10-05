import { cx } from "@/lib/cx";

// The brand mark: a ring (the "sirkel") with one dot sitting on it.
export function LogoMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <circle cx="16" cy="16" r="11" fill="none" strokeWidth="5" stroke={light ? "#ffffff" : "var(--color-primary)"} />
      <circle cx="25.5" cy="7.5" r="5" fill="var(--color-accent)" />
    </svg>
  );
}

export function Wordmark({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const text = { sm: "text-lg", md: "text-[22px]", lg: "text-[26px]" }[size];
  const mark = { sm: 26, md: 30, lg: 34 }[size];
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={mark} light={light} />
      <span className={cx("font-display font-extrabold tracking-tight", text, light ? "text-white" : "text-primary-dark")}>Sirkel</span>
    </span>
  );
}
