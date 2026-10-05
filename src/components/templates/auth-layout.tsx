import type { ReactNode } from "react";
import { Chip } from "@/components/atoms/chip";
import { Wordmark } from "@/components/atoms/logo";
import { Dot, Ring } from "@/components/atoms/ring";

// Login, register and password pages. On a phone the brand panel is a slim
// band above the form; from lg up it is the left half of the screen.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <aside className="relative overflow-hidden bg-primary-dark px-6 pt-7 pb-14 text-white lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:gap-10 lg:p-12">
        <Ring className="-top-24 -right-24 size-72 lg:top-auto lg:-right-56 lg:-bottom-60 lg:size-[640px]" />
        <Ring className="-top-10 -right-8 size-44 lg:top-auto lg:-right-28 lg:-bottom-32 lg:size-[420px]" />
        <Ring className="hidden lg:-right-2 lg:-bottom-8 lg:block lg:size-[220px]" />
        <Dot className="top-16 right-24 size-6 lg:top-28 lg:right-36 lg:size-11" />
        <div className="relative">
          <Wordmark light size="lg" />
        </div>
        <div className="relative hidden max-w-md flex-col items-start gap-4 lg:flex">
          <Chip tone="dark">Panel pengurus</Chip>
          <p className="font-display text-6xl leading-[1.05] font-extrabold tracking-tight">Info lingkungan, satu link.</p>
        </div>
        <p className="relative hidden text-sm text-white/70 lg:block">Dibuat sukarela untuk warga.</p>
      </aside>
      <div className="relative -mt-7 flex flex-1 items-center justify-center rounded-t-[28px] bg-background px-6 py-8 lg:mt-0 lg:flex-[1.1] lg:rounded-none lg:px-8 lg:py-12">
        <div className="flex w-full max-w-md flex-col gap-7">{children}</div>
      </div>
    </main>
  );
}
