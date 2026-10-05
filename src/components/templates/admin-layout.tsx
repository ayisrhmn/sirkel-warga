import type { ReactNode } from "react";

// The frame of every community admin page. Desktop: sidebar on the left.
// Phone: top bar and a fixed bottom bar (hence the extra bottom padding).
export function AdminLayout({
  sidebar,
  topBar,
  bottomNav,
  banner,
  children,
}: {
  sidebar: ReactNode;
  topBar: ReactNode;
  bottomNav: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="hidden lg:block">{sidebar}</div>
      <div className="lg:hidden">{topBar}</div>
      <main className="flex min-w-0 flex-1 flex-col gap-7 px-5 pt-6 pb-28 lg:px-10 lg:pt-9 lg:pb-14">
        {banner}
        {children}
      </main>
      <div className="lg:hidden">{bottomNav}</div>
    </div>
  );
}
