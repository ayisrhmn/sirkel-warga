import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeading } from "./section-heading";

// A titled block of a page. `id` makes it a target of the hero's jump links.
export function PageSection({ id, icon, tone, title, children }: { id?: string; icon: LucideIcon; tone?: "green" | "amber"; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-4">
      <SectionHeading icon={icon} tone={tone}>
        {title}
      </SectionHeading>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
