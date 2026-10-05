import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/atoms/card";
import { Heading } from "@/components/atoms/heading";
import { cx } from "@/lib/cx";

// One numbered step of a multi-step form. A finished step shows a check.
export function StepCard({ step, title, description, done = false, children }: { step: number; title: string; description?: string; done?: boolean; children?: ReactNode }) {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className={cx("flex size-9.5 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold", done ? "bg-primary-tint text-primary" : "bg-primary text-white")}
        >
          {done ? <Check size={20} strokeWidth={3} /> : step}
        </span>
        <div className="flex flex-col gap-1">
          <Heading size="card" className="text-[22px]">
            {title}
          </Heading>
          {description && <p className="text-[15px] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}
