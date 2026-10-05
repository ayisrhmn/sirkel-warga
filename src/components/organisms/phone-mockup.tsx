import { Chip } from "@/components/atoms/chip";
import { Ring } from "@/components/atoms/ring";

// A drawn phone showing a sample community page, for the landing page. Purely
// decorative (hidden from assistive technology); its text is sample content.
export function PhoneMockup() {
  const card = "rounded-2xl border border-line bg-surface p-3";
  return (
    <div aria-hidden="true" className="relative h-[560px] w-[296px] shrink-0 rounded-[44px] bg-ink p-2.5 shadow-[0_40px_60px_-30px_rgba(10,77,64,0.55)]">
      <div className="flex h-full flex-col overflow-hidden rounded-[34px] bg-background">
        <div className="relative overflow-hidden bg-primary-dark px-4.5 pt-8 pb-6 text-white">
          <Ring className="-top-10 -right-8 size-30" />
          <Ring className="top-5 right-8 size-16" />
          <p className="relative text-xs font-semibold opacity-85">Info lingkungan</p>
          <p className="relative font-display text-2xl leading-none font-extrabold">RT 05 Melati Indah</p>
        </div>
        <div className="flex flex-col gap-2.5 p-3.5">
          <p className="font-display text-base font-bold">Pengumuman</p>
          <div className={card}>
            <p className="text-xs font-semibold text-muted">3 Oktober 2026</p>
            <p className="text-sm leading-snug font-bold">Kerja bakti bersih lingkungan Minggu ini</p>
          </div>
          <div className={card}>
            <p className="text-xs font-semibold text-muted">1 Oktober 2026</p>
            <p className="text-sm leading-snug font-bold">Iuran sampah naik mulai November</p>
          </div>
          <p className="mt-1 font-display text-base font-bold">Agenda</p>
          <div className={`${card} flex items-center gap-2.5`}>
            <span className="flex h-12 w-11 flex-col items-center justify-center rounded-xl bg-accent-tint text-lg leading-none font-extrabold text-accent-ink">
              10<span className="text-[10px]">OKT</span>
            </span>
            <p className="text-sm leading-snug font-bold">Rapat bulanan warga</p>
          </div>
          <Chip tone="green">Kontak penting</Chip>
        </div>
      </div>
    </div>
  );
}
