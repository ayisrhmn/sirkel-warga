import { VISIBILITIES, VISIBILITY_HINT, VISIBILITY_LABEL, type Visibility } from "@/lib/dataset";
import { RadioCardGroup } from "./radio-card-group";

// The choice of who can see a report (dataset), shared by the import and edit forms.
export function VisibilityField({
  name = "visibility",
  defaultValue,
  value,
  onChange,
}: {
  name?: string;
  defaultValue?: Visibility;
  value?: Visibility;
  onChange?: (value: Visibility) => void;
}) {
  return (
    <RadioCardGroup
      name={name}
      legend="Tampilan"
      options={VISIBILITIES.map((v) => ({ value: v, label: VISIBILITY_LABEL[v], description: VISIBILITY_HINT[v] }))}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange && ((v) => onChange(v as Visibility))}
    />
  );
}
