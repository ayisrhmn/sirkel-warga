import type { ReactNode } from "react";

// An admin list with its "add" form beside it. On a phone the form comes
// first (so adding is not buried under a long list).
export function AdminSplit({ list, form }: { list: ReactNode; form: ReactNode }) {
  return (
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="order-2 flex flex-col gap-4 xl:order-1">{list}</div>
      <div className="order-1 xl:order-2">{form}</div>
    </div>
  );
}
