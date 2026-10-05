import type { LucideIcon } from "lucide-react";
import { Chip } from "@/components/atoms/chip";
import { Container } from "@/components/atoms/container";
import { Wordmark } from "@/components/atoms/logo";
import { Dot, Ring } from "@/components/atoms/ring";

// The dark green band at the top of a community's public page, with jump
// links to the sections below it.
export function CommunityHero({ name, sections }: { name: string; sections: { id: string; label: string; icon: LucideIcon }[] }) {
  return (
    <header className="relative overflow-hidden bg-primary-dark text-white">
      <Ring className="-top-24 -right-32 size-[520px] sm:-top-40 sm:-right-20" />
      <Ring className="-top-10 -right-12 size-[300px] sm:-top-16 sm:right-6 sm:size-[320px]" />
      <Dot className="right-24 bottom-16 size-6 sm:right-56 sm:bottom-24 sm:size-9" />
      <Container className="relative">
        <div className="py-5">
          <Wordmark light />
        </div>
        <div className="flex flex-col items-start gap-4 pt-4 pb-9 sm:gap-5 sm:pt-10 sm:pb-16">
          <Chip tone="dark">Info lingkungan</Chip>
          <h1 className="font-display text-[2.5rem] leading-[1.05] font-extrabold tracking-tight text-white sm:max-w-3xl sm:text-6xl">{name}</h1>
          <p className="max-w-xl text-lg text-white/85 sm:text-xl">Pengumuman, agenda, kontak penting, dan laporan lingkungan.</p>
          <nav aria-label="Isi halaman" className="mt-1.5 flex flex-wrap gap-2.5">
            {sections.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4.5 text-[15px] font-semibold text-white hover:bg-white/20">
                <Icon aria-hidden="true" size={18} />
                {label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}
