import { Container } from "@/components/atoms/container";
import { Wordmark } from "@/components/atoms/logo";

export function SiteFooter({ size = "content" }: { size?: "narrow" | "content" }) {
  return (
    <Container size={size}>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-7 pb-9 text-sm text-muted">
        <Wordmark size="sm" />
        <span>Dibuat sukarela untuk warga.</span>
      </footer>
    </Container>
  );
}
