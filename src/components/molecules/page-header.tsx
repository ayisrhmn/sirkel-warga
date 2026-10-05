import type { ReactNode } from "react";
import { Heading } from "@/components/atoms/heading";

// The title block at the top of an admin page, with an optional main action.
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Heading as="h1" size="page">
          {title}
        </Heading>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
