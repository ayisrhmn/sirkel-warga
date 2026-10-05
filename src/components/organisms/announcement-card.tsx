import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Heading } from "@/components/atoms/heading";
import { MetaItem } from "@/components/molecules/meta-item";

export function AnnouncementCard({ href, title, date, excerpt }: { href: string; title: string; date: string; excerpt: string }) {
  return (
    <Link href={href} className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-surface p-5 hover:bg-zebra sm:p-6">
      <MetaItem icon={CalendarDays}>{date}</MetaItem>
      <Heading as="h3" size="card" className="text-xl">
        {title}
      </Heading>
      {excerpt && <p className="leading-relaxed text-body">{excerpt}</p>}
      <span className="mt-1 inline-flex items-center gap-2 text-[15px] font-bold text-primary">
        Baca selengkapnya
        <ArrowRight aria-hidden="true" size={18} />
      </span>
    </Link>
  );
}
