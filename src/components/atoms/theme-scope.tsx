import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { themeStyle } from "@/lib/theme";

// Gives everything inside it a community's primary colour. Without a colour
// (or with the default one) it is a plain wrapper. With `fill` (the default)
// it keeps the page's flex column so pages inside still fill the screen.
export function ThemeScope({ color, fill = true, children }: { color: string | null | undefined; fill?: boolean; children: ReactNode }) {
  return (
    <div style={themeStyle(color)} className={cx(fill && "flex flex-1 flex-col")}>
      {children}
    </div>
  );
}
