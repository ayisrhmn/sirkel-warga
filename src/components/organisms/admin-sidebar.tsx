import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/atoms/avatar";
import { Chip } from "@/components/atoms/chip";
import { Wordmark } from "@/components/atoms/logo";
import { LogoutButton } from "@/components/molecules/logout-button";
import { NavLink } from "@/components/molecules/nav-link";
import { adminNavSections } from "./admin-nav-items";

const utilLink = "flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium text-body hover:bg-zebra";

// The admin menu on desktop: which community you are in, the sections, and
// the account links at the bottom.
export function AdminSidebar({
  community,
  roleLabel,
  owner,
  forced,
  isPlatformAdmin,
  user,
}: {
  community: { name: string; slug: string };
  roleLabel: string;
  owner: boolean;
  forced: boolean;
  isPlatformAdmin: boolean;
  user: { name: string; username?: string | null };
}) {
  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-5">
      <div className="px-1.5 py-1">
        <Wordmark />
      </div>
      <div className="flex flex-col gap-1.5 rounded-2xl bg-background p-3.5">
        <p className="text-xs font-bold tracking-wider text-muted uppercase">Komunitas</p>
        <p className="leading-snug font-bold text-ink">{community.name}</p>
        <p className="font-mono text-[13px] text-muted">/{community.slug}</p>
        <div className="mt-1">
          <Chip tone={forced ? "amber" : "green"}>{roleLabel}</Chip>
        </div>
      </div>
      <nav aria-label="Menu admin" className="flex flex-1 flex-col gap-0.5">
        {adminNavSections(community.slug, owner).map((section, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {section.label && <p className="px-3.5 pt-3.5 pb-1 text-xs font-bold tracking-wider text-muted uppercase">{section.label}</p>}
            {section.items.map((item) => (
              <NavLink key={item.href} href={item.href} icon={<item.icon aria-hidden="true" size={20} />} exact={item.exact}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-0.5 border-t border-line pt-3">
        <Link href={`/${community.slug}`} className={utilLink}>
          <ExternalLink aria-hidden="true" size={19} />
          Halaman publik
        </Link>
        <Link href="/change-password" className={utilLink}>
          <KeyRound aria-hidden="true" size={19} />
          Ganti password
        </Link>
        {isPlatformAdmin && (
          <Link href="/platform" className={utilLink}>
            <ShieldCheck aria-hidden="true" size={19} />
            Platform
          </Link>
        )}
        <LogoutButton full align="start" />
      </div>
      <div className="flex items-center gap-3 px-1.5 pt-1">
        <Avatar name={user.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-snug font-bold">{user.name}</p>
          {user.username && <p className="truncate text-[13px] text-muted">@{user.username}</p>}
        </div>
      </div>
    </aside>
  );
}
