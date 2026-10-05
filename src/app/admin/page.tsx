import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Heading } from "@/components/atoms/heading";
import { IconTile } from "@/components/atoms/icon-tile";
import { Wordmark } from "@/components/atoms/logo";
import { Card } from "@/components/atoms/card";
import { LogoutButton } from "@/components/molecules/logout-button";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireUser();
  if (user.isPlatformAdmin) redirect("/platform");
  const memberships = await getDb().membership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { community: { select: { slug: true, name: true } } },
  });

  if (memberships.length === 1)
    redirect(`/admin/${memberships[0].community.slug}`);

  return (
    <Container size="narrow" className="flex-1">
      <div className="flex items-center justify-between gap-3 py-5">
        <Wordmark />
        <LogoutButton />
      </div>
      <main className="flex flex-col gap-6 pt-6 pb-14">
        <Heading as="h1" size="page">
          Halo, {user.name}
        </Heading>
        {memberships.length === 0 ? (
          <Card padding="lg" className="flex flex-col items-start gap-4">
            <IconTile icon={Users} tone="amber" size="lg" />
            <p className="text-xl font-bold">Kamu belum punya komunitas.</p>
            <ButtonLink href="/create-community" icon={Plus}>
              Buat komunitas
            </ButtonLink>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {memberships.map(({ community }) => (
              <li key={community.slug}>
                <Link href={`/admin/${community.slug}`} className="flex min-h-14 items-center rounded-2xl border border-line bg-surface px-5 font-bold hover:bg-zebra">
                  {community.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </Container>
  );
}
