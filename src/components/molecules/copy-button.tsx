"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonStyle } from "@/components/atoms/button";

// Copies a full link to the clipboard. `path` is relative ("/rt-05"); the
// address of this site is added in the browser.
export function CopyButton({ path, variant = "secondary" }: { path: string; variant?: ButtonStyle["variant"] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant={variant} icon={copied ? Check : Copy} onClick={copy}>
      {copied ? "Tersalin" : "Salin link"}
    </Button>
  );
}
