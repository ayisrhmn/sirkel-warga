import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/atoms/avatar";
import { Chip } from "@/components/atoms/chip";
import { Heading } from "@/components/atoms/heading";
import { DeleteButton } from "@/components/molecules/delete-button";
import { EditDisclosure } from "@/components/molecules/edit-disclosure";
import { EmptyState } from "@/components/molecules/empty-state";
import { FormPanel } from "@/components/molecules/form-panel";
import { MetaItem } from "@/components/molecules/meta-item";
import { PageHeader } from "@/components/molecules/page-header";
import { AdminListItem } from "@/components/organisms/admin-list-item";
import { AdminSplit } from "@/components/templates/admin-split";
import { requireMember } from "@/lib/access";
import { getDb } from "@/lib/db";
import { deleteContact } from "./actions";
import { ContactForm } from "./contact-form";

export default async function ContactsPage({
  params,
}: PageProps<"/admin/[communitySlug]/contacts">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);

  const items = await getDb().contact.findMany({
    where: { communityId: community.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true, phone: true, sortOrder: true },
  });

  return (
    <>
      <PageHeader title="Kontak penting" description="Warga bisa langsung chat WhatsApp dari halaman komunitas." />
      <AdminSplit
        form={
          <FormPanel title="Tambah kontak">
            <ContactForm slug={community.slug} />
          </FormPanel>
        }
        list={
          <>
            <Heading>Kontak penting ({items.length})</Heading>
            {items.length === 0 && <EmptyState>Belum ada kontak.</EmptyState>}
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <AdminListItem
                  key={item.id}
                  lead={<Avatar name={item.name} />}
                  title={item.name}
                  meta={
                    <>
                      <span>{item.role}</span>
                      <MetaItem icon={MessageCircle}>{item.phone}</MetaItem>
                      <Chip>Urutan {item.sortOrder}</Chip>
                    </>
                  }
                  action={
                    <DeleteButton
                      action={deleteContact.bind(null, community.slug, item.id)}
                      confirmText={`Hapus kontak "${item.name}"?`}
                    />
                  }
                >
                  <EditDisclosure summary="Edit">
                    <ContactForm
                      slug={community.slug}
                      item={{
                        id: item.id,
                        name: item.name,
                        role: item.role,
                        phone: item.phone,
                        sortOrder: String(item.sortOrder),
                      }}
                    />
                  </EditDisclosure>
                </AdminListItem>
              ))}
            </ul>
          </>
        }
      />
    </>
  );
}
