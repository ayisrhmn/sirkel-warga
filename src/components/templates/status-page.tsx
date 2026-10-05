import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Heading } from "@/components/atoms/heading";
import { Ring } from "@/components/atoms/ring";

const tones = {
  green: { icon: "text-primary", ring: "tint" },
  amber: { icon: "text-accent-ink", ring: "accent" },
} as const satisfies Record<string, { icon: string; ring: "tint" | "accent" }>;

// A centred message for a dead end: wrong link, failure, or nothing here yet.
// Rendered directly (no data needed), so it is also safe for the error boundary.
export function StatusPage({
  icon: Icon,
  tone = "green",
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  tone?: keyof typeof tones;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <Ring tone={tones[tone].ring} className="size-[520px] border-[24px]" />
      <Ring tone={tones[tone].ring} className="size-[380px]" />
      <div className="relative flex max-w-md flex-col items-center gap-4 text-center">
        <span className="flex size-22 items-center justify-center rounded-full border border-line bg-surface">
          <Icon aria-hidden="true" size={42} strokeWidth={1.8} className={tones[tone].icon} />
        </span>
        <Heading as="h1" size="page">
          {title}
        </Heading>
        {children && <div className="text-lg text-muted">{children}</div>}
        {action}
      </div>
    </main>
  );
}
