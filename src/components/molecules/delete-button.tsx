"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/button";

// Deletes through a Server Action after the browser's confirm dialog.
export function DeleteButton({
  action,
  confirmText,
  label = "Hapus",
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <Button variant="danger-outline" size="sm" icon={Trash2}>
        {label}
      </Button>
    </form>
  );
}
