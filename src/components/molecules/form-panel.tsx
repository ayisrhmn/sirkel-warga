import type { ReactNode } from "react";
import { Card } from "@/components/atoms/card";
import { Heading } from "@/components/atoms/heading";

// A card with a title, holding one form or one block of settings.
export function FormPanel({ title, tone = "default", children }: { title: string; tone?: "default" | "danger"; children: ReactNode }) {
  return (
    <Card padding="lg" className={tone === "danger" ? "flex flex-col gap-5 border-2 border-danger/30 bg-danger-tint/30" : "flex flex-col gap-5"}>
      <Heading className={tone === "danger" ? "text-danger" : undefined}>{title}</Heading>
      {children}
    </Card>
  );
}
