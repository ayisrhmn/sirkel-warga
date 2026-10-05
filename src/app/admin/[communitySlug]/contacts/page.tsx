import { DeleteButton } from "@/components/delete-button";
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
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tambah kontak</h2>
        <ContactForm slug={community.slug} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Kontak penting ({items.length})</h2>
        {items.length === 0 && (
          <p className="text-neutral-600">Belum ada kontak.</p>
        )}
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-neutral-600">
                  {item.role} · {item.phone}
                </p>
              </div>
              <details>
                <summary className="cursor-pointer underline">Edit</summary>
                <div className="mt-3">
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
                </div>
              </details>
              <DeleteButton
                action={deleteContact.bind(null, community.slug, item.id)}
                confirmText={`Hapus kontak "${item.name}"?`}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
