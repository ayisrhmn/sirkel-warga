import { Container } from "@/components/atoms/container";

const AUTHOR = { name: "Muhammad Fariz Rahman", url: "https://ayisrhmn.vercel.app" };

// The footer of every public page, the landing page included.
export function SiteFooter({ size = "content" }: { size?: "narrow" | "content" }) {
  return (
    <Container size={size}>
      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line pt-6 pb-8 text-sm text-muted">
        <span>
          &copy; {new Date().getFullYear()}{" "}
          <a href={AUTHOR.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold underline">
            {AUTHOR.name}
          </a>
        </span>
        <span>Dibuat sukarela untuk warga.</span>
      </footer>
    </Container>
  );
}
