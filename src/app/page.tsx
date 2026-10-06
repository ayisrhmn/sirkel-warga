import { CalendarDays, Link2, LogIn, Megaphone, Table2 } from "lucide-react";
import { ButtonLink } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Heading } from "@/components/atoms/heading";
import { IconTile } from "@/components/atoms/icon-tile";
import { Wordmark } from "@/components/atoms/logo";
import { WhatsAppIcon } from "@/components/atoms/whatsapp-icon";

import { Ring, Dot } from "@/components/atoms/ring";
import { PhoneMockup } from "@/components/organisms/phone-mockup";
import { SiteFooter } from "@/components/organisms/site-footer";

const FEATURES = [
  { icon: Megaphone, tone: "green", title: "Pengumuman", text: "Kabar terbaru dari pengurus." },
  { icon: CalendarDays, tone: "amber", title: "Agenda", text: "Jadwal rapat dan kegiatan." },
  { icon: WhatsAppIcon, tone: "green", title: "Kontak penting", text: "Chat WhatsApp pengurus sekali tap." },
  { icon: Table2, tone: "amber", title: "Laporan", text: "Kas dan data lingkungan dalam tabel." },
] as const;

export default function Home() {
  return (
    <>
      <Container>
        <header className="flex items-center justify-between gap-3 py-5">
          <Wordmark />
          <ButtonLink href="/login" prefetch={false} variant="secondary" size="sm" icon={LogIn}>
            Login pengurus
          </ButtonLink>
        </header>
        <main className="flex flex-col items-center gap-8 pt-4 pb-8 lg:flex-row lg:gap-12 lg:pt-10 lg:pb-14">
          <div className="flex flex-col gap-5 lg:flex-1 lg:gap-6">
            <h1 className="font-display text-[2.9rem] leading-[1.02] font-extrabold tracking-tight text-primary-dark lg:text-8xl">Info lingkungan, satu link.</h1>
            <p className="max-w-xl text-lg text-body lg:text-[22px]">Tempat warga lihat pengumuman, agenda, kontak penting, dan laporan lingkungan.</p>
            <div className="flex max-w-xl items-start gap-3.5 rounded-[20px] border border-line bg-surface p-4.5">
              <IconTile icon={Link2} tone="amber" />
              <p className="text-body">Buka lewat link yang dibagikan pengurus RT-mu. Belum punya link? Tanya pengurus lingkunganmu.</p>
            </div>
          </div>
          <div className="relative flex min-h-[620px] w-full items-center justify-center overflow-hidden lg:flex-1">
            <Ring tone="tint" className="size-[380px] border-[28px] lg:size-[520px]" />
            <Ring tone="tint" className="size-[270px] lg:size-[400px]" />
            <Dot className="top-16 right-3 size-10 lg:top-24 lg:right-10 lg:size-14" />
            <PhoneMockup />
          </div>
        </main>
        <ul className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon, tone, title, text }) => (
            <li key={title} className="flex items-center gap-3.5 rounded-[20px] border border-line bg-surface p-5 lg:flex-col lg:items-start">
              <IconTile icon={icon} tone={tone} size="lg" />
              <div>
                <Heading as="h2" size="card">
                  {title}
                </Heading>
                <p className="text-[15px] text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
      <SiteFooter />
    </>
  );
}
