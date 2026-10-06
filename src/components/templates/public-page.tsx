import type { ReactNode } from "react";
import { Container } from "@/components/atoms/container";
import { ThemeScope } from "@/components/atoms/theme-scope";
import { Wordmark } from "@/components/atoms/logo";
import { BackLink } from "@/components/molecules/back-link";
import { SiteFooter } from "@/components/organisms/site-footer";

// A page for residents that sits under a community page: a way back at the
// top, the content, then the footer.
export function PublicPage({
  back,
  size = "narrow",
  themeColor,
  children,
}: {
  back: { href: string; label: string };
  size?: "narrow" | "content";
  themeColor?: string | null;
  children: ReactNode;
}) {
  return (
    <ThemeScope color={themeColor}>
      <Container size={size}>
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <BackLink href={back.href}>{back.label}</BackLink>
          <Wordmark size="sm" />
        </div>
        <main className="flex flex-col gap-5 pt-6 pb-14">{children}</main>
      </Container>
      <SiteFooter size={size} />
    </ThemeScope>
  );
}
