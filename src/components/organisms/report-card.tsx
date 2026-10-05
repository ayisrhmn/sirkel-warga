import { ChevronRight, Lock, Table2 } from "lucide-react";
import Link from "next/link";
import { Chip } from "@/components/atoms/chip";
import { IconTile } from "@/components/atoms/icon-tile";

// A link to a report (dataset) on the community page. Protected reports say so
// before the visitor taps.
export function ReportCard({ href, title, period, locked }: { href: string; title: string; period: string | null; locked: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 hover:bg-zebra">
      <IconTile icon={locked ? Lock : Table2} tone={locked ? "amber" : "green"} shape="square" />
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-bold text-ink">{title}</span>
        {period && <span className="block text-sm text-muted">{period}</span>}
      </span>
      {locked ? <Chip tone="amber">Dilindungi</Chip> : <ChevronRight aria-hidden="true" size={20} className="text-muted" />}
    </Link>
  );
}
