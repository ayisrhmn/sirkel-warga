"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { IconTile } from "@/components/atoms/icon-tile";

// A file picker drawn as a drop area. The real <input type="file"> lies
// invisibly over the whole area, so clicking, dragging a file in, and the
// keyboard all work natively. Shows the chosen file's name.
export function FileInput({ hint, onChange, ...props }: Omit<ComponentProps<"input">, "type" | "className"> & { hint?: string }) {
  const [fileName, setFileName] = useState("");

  return (
    <div className="relative flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line-strong bg-surface px-4 py-6 text-center transition-colors hover:bg-zebra has-focus-visible:outline-3 has-focus-visible:outline-accent">
      <IconTile icon={fileName ? FileSpreadsheet : Upload} />
      <span className="max-w-full font-bold break-all text-ink">{fileName || "Pilih file atau seret ke sini"}</span>
      {hint && <span className="text-sm font-normal text-muted">{hint}</span>}
      <input
        {...props}
        type="file"
        onChange={(e) => {
          setFileName(e.target.files?.[0]?.name ?? "");
          onChange?.(e);
        }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </div>
  );
}
