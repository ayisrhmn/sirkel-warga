import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireUser();
  const memberships = await getDb().membership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { community: { select: { slug: true, name: true } } },
  });

  if (memberships.length === 1)
    redirect(`/admin/${memberships[0].community.slug}`);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Halo, {user.name}</h1>
      {memberships.length === 0 ? (
        <p>
          Kamu belum punya komunitas.{" "}
          <Link href="/create-community" className="underline">
            Buat komunitas
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {memberships.map(({ community }) => (
            <li key={community.slug}>
              <Link href={`/admin/${community.slug}`} className="underline">
                {community.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {user.isPlatformAdmin && (
        <Link href="/platform" className="underline">
          Persetujuan akun
        </Link>
      )}
      <LogoutButton />
    </main>
  );
}
