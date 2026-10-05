import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { IconTile } from "@/components/atoms/icon-tile";

// A number with a label that links to the list it counts (admin overview).
export function StatTile({
  href,
  icon,
  tone,
  value,
  label,
  note,
}: {
  href: string;
  icon: LucideIcon;
  tone: "green" | "amber";
  value: number;
  label: string;
  note?: string;
}) {
  return (
    <Link href={href} className="flex flex-1 basis-44 flex-col gap-2.5 rounded-[20px] border border-line bg-surface p-5 hover:bg-zebra">
      <span className="flex items-center justify-between">
        <IconTile icon={icon} tone={tone} shape="square" />
        <ChevronRight aria-hidden="true" size={20} className="text-muted" />
      </span>
      <span className="font-display text-5xl leading-none font-extrabold text-ink">{value}</span>
      <span>
        <span className="block font-bold">{label}</span>
        {note && <span className="block text-sm text-muted">{note}</span>}
      </span>
    </Link>
  );
}
