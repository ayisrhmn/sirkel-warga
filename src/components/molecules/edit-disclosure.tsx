"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/atoms/button";

// A <details> whose content is only mounted once it has been opened. The edit
// forms hold a rich text editor each; a long list should not start dozens of
// editors that nobody has asked for.
export function EditDisclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  return (
    <details onToggle={(e) => e.currentTarget.open && setOpened(true)}>
      <summary className={buttonClass({ variant: "secondary", size: "sm" }, "list-none [&::-webkit-details-marker]:hidden")}>
        <Pencil aria-hidden="true" size={18} />
        {summary}
      </summary>
      <div className="mt-4 border-t border-line pt-4">{opened && children}</div>
    </details>
  );
}
