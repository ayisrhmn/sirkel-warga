import { cx } from "@/lib/cx";

export type RadioOption = { value: string; label: string; description?: string };

// A set of radio buttons drawn as cards: easier to read and tap than a
// dropdown for 2-3 choices. Works uncontrolled (`defaultValue`, inside a
// <form>) or controlled (`value` and `onChange`).
export function RadioCardGroup({
  name,
  legend,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[15px] font-semibold text-ink">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cx(
            "flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3.5",
            "has-checked:border-primary has-checked:bg-primary-tint has-focus-visible:outline-3 has-focus-visible:outline-accent",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={value === undefined ? option.value === defaultValue : undefined}
            checked={value === undefined ? undefined : option.value === value}
            onChange={onChange ? () => onChange(option.value) : undefined}
            className="mt-0.5 size-5 accent-primary"
          />
          <span className="flex flex-col">
            <span className="font-bold text-ink">{option.label}</span>
            {option.description && <span className="text-sm leading-snug text-muted">{option.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
