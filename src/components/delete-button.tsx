"use client";

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
      <button className="text-red-600 underline">{label}</button>
    </form>
  );
}
