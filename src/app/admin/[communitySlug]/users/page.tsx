import { Avatar } from "@/components/atoms/avatar";
import { Chip } from "@/components/atoms/chip";
import { Heading } from "@/components/atoms/heading";
import { FormPanel } from "@/components/molecules/form-panel";
import { PageHeader } from "@/components/molecules/page-header";
import { AdminListItem } from "@/components/organisms/admin-list-item";
import { AdminSplit } from "@/components/templates/admin-split";
import { requireMember } from "@/lib/access";
import { listMembers } from "@/lib/queries/accounts";
import { AddAdminForm } from "./add-admin-form";
import { RemoveAdminButton, ResetPasswordForm } from "./member-actions";

export default async function UsersPage({
  params,
}: PageProps<"/admin/[communitySlug]/users">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug, { owner: true });

  const members = await listMembers(community.id);

  return (
    <>
      <PageHeader title="Pengguna" description="Admin hanya bisa mengelola komunitas ini." />
      <AdminSplit
        form={
          <FormPanel title="Tambah admin">
            <AddAdminForm slug={community.slug} />
          </FormPanel>
        }
        list={
          <>
            <Heading>Pengguna ({members.length})</Heading>
            <ul className="flex flex-col gap-3">
              {members.map(({ role, user }) => (
                <AdminListItem
                  key={user.id}
                  lead={<Avatar name={user.name} />}
                  title={user.name}
                  meta={
                    <>
                      <span>@{user.username}</span>
                      <Chip tone={role === "owner" ? "green" : "gray"}>{role === "owner" ? "Super admin" : "Admin"}</Chip>
                    </>
                  }
                  action={role === "admin" && <RemoveAdminButton slug={community.slug} userId={user.id} name={user.name} />}
                >
                  {role === "admin" && <ResetPasswordForm slug={community.slug} userId={user.id} />}
                </AdminListItem>
              ))}
            </ul>
          </>
        }
      />
    </>
  );
}
