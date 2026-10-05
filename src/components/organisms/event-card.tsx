import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Heading } from "@/components/atoms/heading";
import { DateTile } from "@/components/molecules/date-tile";
import { MetaItem } from "@/components/molecules/meta-item";

export function EventCard({
  href,
  title,
  tile,
  time,
  location,
  excerpt,
}: {
  href: string;
  title: string;
  tile: { month: string; day: string };
  time: string;
  location: string | null;
  excerpt: string;
}) {
  return (
    <Link href={href} className="flex items-start gap-4 rounded-[20px] border border-line bg-surface p-4 hover:bg-zebra sm:gap-5 sm:p-5">
      <DateTile {...tile} size="lg" />
      <div className="flex min-w-0 flex-col gap-2">
        <Heading as="h3" size="card" className="text-xl">
          {title}
        </Heading>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <MetaItem icon={Clock}>{time}</MetaItem>
          {location && <MetaItem icon={MapPin}>{location}</MetaItem>}
        </div>
        {excerpt && <p className="leading-relaxed text-body">{excerpt}</p>}
      </div>
    </Link>
  );
}
