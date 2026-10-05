import { requireMember } from "@/lib/access";
import { getDb } from "@/lib/db";
import { AddAdminForm } from "./add-admin-form";
import { RemoveAdminButton, ResetPasswordForm } from "./member-actions";

export default async function UsersPage({
  params,
}: PageProps<"/admin/[communitySlug]/users">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug, { owner: true });

  const members = await getDb().membership.findMany({
    where: { communityId: community.id },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      role: true,
      user: { select: { id: true, name: true, username: true } },
    },
  });

  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Pengguna</h2>
        <ul className="flex flex-col gap-3">
          {members.map(({ role, user }) => (
            <li
              key={user.id}
              className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3"
            >
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-neutral-600">
                  @{user.username} ·{" "}
                  {role === "owner" ? "Super admin" : "Admin"}
                </p>
              </div>
              {role === "admin" && (
                <div className="flex flex-col gap-2">
                  <ResetPasswordForm slug={community.slug} userId={user.id} />
                  <RemoveAdminButton
                    slug={community.slug}
                    userId={user.id}
                    name={user.name}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tambah admin</h2>
        <AddAdminForm slug={community.slug} />
      </section>
    </main>
  );
}
