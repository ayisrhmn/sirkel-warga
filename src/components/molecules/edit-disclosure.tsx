"use client";

import { useState } from "react";

// A <details> whose content is only mounted once it has been opened. The edit
// forms hold a rich text editor each; a long list should not start dozens of
// editors that nobody has asked for.
export function EditDisclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  return (
    <details onToggle={(e) => e.currentTarget.open && setOpened(true)}>
      <summary className="cursor-pointer underline">{summary}</summary>
      <div className="mt-3">{opened && children}</div>
    </details>
  );
}
