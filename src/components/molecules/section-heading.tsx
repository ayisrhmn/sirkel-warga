import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Heading } from "@/components/atoms/heading";
import { IconTile } from "@/components/atoms/icon-tile";

// The title of a page section: an icon tile and a heading, with an optional
// control on the right.
export function SectionHeading({
  icon,
  tone = "green",
  children,
  action,
}: {
  icon: LucideIcon;
  tone?: "green" | "amber";
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} tone={tone} />
        <Heading>{children}</Heading>
      </div>
      {action}
    </div>
  );
}
