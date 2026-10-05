import { cx } from "@/lib/cx";

// A short row of mutually exclusive choices (2-4), e.g. "1 2 3".
export function SegmentedControl({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={legend} className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold">{legend}</span>
      <div className="inline-flex w-fit overflow-hidden rounded-xl border-[1.5px] border-line-strong">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={cx("min-h-11.5 min-w-14 cursor-pointer px-4.5 text-base font-bold", option === value ? "bg-primary text-white" : "bg-surface text-ink hover:bg-zebra")}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
