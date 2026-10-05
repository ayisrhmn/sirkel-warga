import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { requireMember } from "@/lib/access";

export default async function CommunityAdminLayout({
  children,
  params,
}: LayoutProps<"/admin/[communitySlug]">) {
  const { communitySlug } = await params;
  const { user, community, role } = await requireMember(communitySlug);
  const base = `/admin/${community.slug}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">{community.name}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {user.name} ({role === "owner" ? "Super admin" : "Admin"})
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 [&_a]:py-1 [&_button]:py-1">
          <Link href={base} className="underline">
            Ringkasan
          </Link>
          <Link href={`${base}/announcements`} className="underline">
            Pengumuman
          </Link>
          <Link href={`${base}/events`} className="underline">
            Agenda
          </Link>
          <Link href={`${base}/contacts`} className="underline">
            Kontak
          </Link>
          <Link href={`${base}/datasets`} className="underline">
            Laporan
          </Link>
          {role === "owner" && (
            <>
              <Link href={`${base}/users`} className="underline">
                Pengguna
              </Link>
              <Link href={`${base}/settings`} className="underline">
                Pengaturan
              </Link>
            </>
          )}
          <Link href={`/${community.slug}`} className="underline">
            Halaman publik
          </Link>
          <Link href="/change-password" className="underline">
            Ganti password
          </Link>
          {user.isPlatformAdmin && (
            <Link href="/platform" className="underline">
              Persetujuan akun
            </Link>
          )}
          <LogoutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
