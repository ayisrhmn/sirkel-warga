import { cx } from "@/lib/cx";

// A calendar-page tile (month over day). `muted` is for dates that have passed.
export function DateTile({ month, day, muted = false, size = "md" }: { month: string; day: string; muted?: boolean; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex shrink-0 flex-col items-center justify-center rounded-2xl py-2",
        muted ? "bg-zinc-200/70 text-zinc-700" : "bg-accent-tint text-accent-ink",
        size === "lg" ? "w-[72px]" : "w-15",
      )}
    >
      <span className="text-xs font-extrabold tracking-widest">{month}</span>
      <span className={cx("font-display font-extrabold leading-none", size === "lg" ? "text-4xl" : "text-[28px]")}>{day}</span>
    </span>
  );
}
