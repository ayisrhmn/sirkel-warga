import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { formatDate } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { approveUser, rejectUser } from "./actions";

export default async function PlatformPage() {
  const user = await requireUser();
  if (!user.isPlatformAdmin) notFound();

  const db = getDb();
  const [pending, communities] = await Promise.all([
    db.user.findMany({
      where: { approved: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, username: true, createdAt: true },
    }),
    db.community.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        memberships: { select: { role: true, user: { select: { name: true, username: true } } } },
      },
    }),
  ]);
  const muted = "text-neutral-600";
  const card = "rounded-md border border-neutral-300 p-3";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Platform</h1>
        <p className={`text-sm ${muted}`}>
          {user.name} (platform admin). Kamu mengelola layanan, bukan komunitas:
          akun ini tidak bisa membuat komunitas, tapi bisa masuk ke komunitas
          mana pun bila diperlukan.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 [&_a]:py-1 [&_button]:py-1">
          <Link href="/change-password" className="underline">
            Ganti password
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Akun menunggu persetujuan ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className={muted}>Tidak ada akun yang menunggu.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((u) => (
              <li key={u.id} className={`${card} flex items-center justify-between gap-3`}>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className={`text-sm ${muted}`}>@{u.username}</p>
                </div>
                <div className="flex gap-3">
                  <form action={approveUser.bind(null, u.id)}>
                    <button className="underline">Setujui</button>
                  </form>
                  <form action={rejectUser.bind(null, u.id)}>
                    <button className="text-red-600 underline">Tolak</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Komunitas ({communities.length})</h2>
        {communities.length === 0 ? (
          <p className={muted}>Belum ada komunitas.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {communities.map((c) => {
              const owner = c.memberships.find((m) => m.role === "owner")?.user;
              return (
                <li key={c.id} className={`${card} flex flex-col gap-2`}>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className={`text-sm ${muted}`}>
                      <span className="font-mono">/{c.slug}</span> · dibuat {formatDate(c.createdAt)}
                    </p>
                    <p className={`text-sm ${muted}`}>
                      Super admin: {owner ? `${owner.name} (@${owner.username})` : "-"} ·{" "}
                      {c.memberships.length} anggota
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <Link href={`/admin/${c.slug}`} className="underline">
                      Kelola (akses paksa)
                    </Link>
                    <Link href={`/admin/${c.slug}/settings`} className="underline">
                      Pengaturan dan hapus
                    </Link>
                    <Link href={`/${c.slug}`} className="underline">
                      Halaman publik
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
