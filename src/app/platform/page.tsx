import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { approveUser, rejectUser } from "./actions";

export default async function PlatformPage() {
  const user = await requireUser();
  if (!user.isPlatformAdmin) notFound();

  const pending = await getDb().user.findMany({
    where: { approved: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, username: true, createdAt: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Persetujuan akun</h1>
      {pending.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          Tidak ada akun yang menunggu.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-300 p-3 dark:border-neutral-700"
            >
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  @{u.username}
                </p>
              </div>
              <div className="flex gap-3">
                <form action={approveUser.bind(null, u.id)}>
                  <button className="underline">Setujui</button>
                </form>
                <form action={rejectUser.bind(null, u.id)}>
                  <button className="text-red-600 underline dark:text-red-400">
                    Tolak
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
