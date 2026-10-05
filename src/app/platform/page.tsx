import { Check, ExternalLink, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/atoms/avatar";
import { Button, ButtonLink } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { Chip } from "@/components/atoms/chip";
import { Container } from "@/components/atoms/container";
import { Heading } from "@/components/atoms/heading";
import { Wordmark } from "@/components/atoms/logo";
import { EmptyState } from "@/components/molecules/empty-state";
import { LogoutButton } from "@/components/molecules/logout-button";
import { formatDate } from "@/lib/datetime";
import { listCommunitiesWithMembers } from "@/lib/queries/communities";
import { listPendingUsers } from "@/lib/queries/accounts";
import { requireUser } from "@/lib/session";
import { approveUser, rejectUser } from "./actions";

export default async function PlatformPage() {
  const user = await requireUser();
  if (!user.isPlatformAdmin) notFound();

  const [pending, communities] = await Promise.all([listPendingUsers(), listCommunitiesWithMembers()]);
  const memberCount = communities.reduce((sum, c) => sum + c.memberships.length, 0);

  return (
    <>
      <header className="border-b border-line bg-surface">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-3.5">
          <div className="flex items-center gap-3.5">
            <Wordmark />
            <Chip tone="amber" icon={ShieldCheck}>
              Platform admin
            </Chip>
          </div>
          <div className="flex items-center gap-1.5">
            <ButtonLink href="/change-password" variant="ghost" size="sm">
              Ganti password
            </ButtonLink>
            <LogoutButton />
          </div>
        </Container>
      </header>
      <Container className="flex flex-1 flex-col gap-7 pt-10 pb-16">
        <div className="flex flex-col gap-2.5">
          <Heading as="h1" size="page">
            Platform
          </Heading>
          <p className="max-w-3xl text-muted">
            {user.name} (platform admin). Kamu mengelola layanan, bukan komunitas:
            akun ini tidak bisa membuat komunitas, tapi bisa masuk ke komunitas
            mana pun bila diperlukan.
          </p>
        </div>

        <dl className="flex flex-wrap gap-4">
          <Stat value={pending.length} label="Akun menunggu persetujuan" tone="amber" />
          <Stat value={communities.length} label="Komunitas" />
          <Stat value={memberCount} label="Pengurus di semua komunitas" />
        </dl>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <section className="flex flex-col gap-4">
            <Heading>Akun menunggu persetujuan ({pending.length})</Heading>
            {pending.length === 0 ? (
              <EmptyState>Tidak ada akun yang menunggu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((u) => (
                  <li key={u.id}>
                    <Card className="flex flex-col gap-4">
                      <div className="flex items-center gap-3.5">
                        <Avatar name={u.name} />
                        <div>
                          <p className="font-bold">{u.name}</p>
                          <p className="text-sm text-muted">@{u.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <form action={approveUser.bind(null, u.id)} className="flex-1">
                          <Button size="sm" full icon={Check}>
                            Setujui
                          </Button>
                        </form>
                        <form action={rejectUser.bind(null, u.id)} className="flex-1">
                          <Button variant="danger-outline" size="sm" full icon={X}>
                            Tolak
                          </Button>
                        </form>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <Heading>Komunitas ({communities.length})</Heading>
            {communities.length === 0 ? (
              <EmptyState>Belum ada komunitas.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3.5">
                {communities.map((c) => {
                  const owner = c.memberships.find((m) => m.role === "owner")?.user;
                  return (
                    <li key={c.id}>
                      <Card className="flex flex-col gap-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold">{c.name}</p>
                            <p className="text-sm text-muted">
                              <span className="font-mono">/{c.slug}</span> · dibuat {formatDate(c.createdAt)}
                            </p>
                          </div>
                          <Chip icon={Users}>{c.memberships.length} anggota</Chip>
                        </div>
                        <p className="text-[15px] text-body">
                          Super admin: <strong>{owner ? owner.name : "-"}</strong>
                          {owner && ` (@${owner.username})`}
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          <ButtonLink href={`/admin/${c.slug}`} size="sm" icon={ShieldCheck}>
                            Kelola (akses paksa)
                          </ButtonLink>
                          <ButtonLink href={`/admin/${c.slug}/settings`} variant="secondary" size="sm" icon={SlidersHorizontal}>
                            Pengaturan dan hapus
                          </ButtonLink>
                          <ButtonLink href={`/${c.slug}`} variant="ghost" size="sm" icon={ExternalLink}>
                            Halaman publik
                          </ButtonLink>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "amber" }) {
  return (
    <div className="flex flex-1 basis-52 items-center gap-4 rounded-[20px] border border-line bg-surface p-5">
      <dd className={`font-display text-5xl leading-none font-extrabold ${tone === "amber" ? "text-accent-ink" : "text-primary-dark"}`}>{value}</dd>
      <dt className="leading-snug font-bold">{label}</dt>
    </div>
  );
}
