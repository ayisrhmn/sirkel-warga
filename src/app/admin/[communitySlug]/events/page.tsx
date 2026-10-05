import { DeleteButton } from "@/components/delete-button";
import { EditDisclosure } from "@/components/edit-disclosure";
import { requireMember } from "@/lib/access";
import { asTimeZone, formatDateTime, TIME_ZONES, toLocalInput } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import { deleteEvent } from "./actions";
import { EventForm } from "./event-form";

export default async function EventsPage({
  params,
}: PageProps<"/admin/[communitySlug]/events">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);

  const zone = asTimeZone(community.timezone);
  const zoneLabel = TIME_ZONES[zone].label;
  const items = await getDb().event.findMany({
    where: { communityId: community.id },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      location: true,
      description: true,
      descriptionDoc: true,
    },
  });

  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tambah agenda</h2>
        <EventForm slug={community.slug} zoneLabel={zoneLabel} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Agenda ({items.length})</h2>
        {items.length === 0 && (
          <p className="text-neutral-600">Belum ada agenda.</p>
        )}
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-neutral-600">
                  {formatDateTime(item.startsAt, zone)}
                </p>
              </div>
              <EditDisclosure summary="Edit">
                <EventForm
                  slug={community.slug}
                  zoneLabel={zoneLabel}
                  item={{
                    id: item.id,
                    title: item.title,
                    startsAt: toLocalInput(item.startsAt, zone),
                    location: item.location ?? "",
                    description: item.description ?? "",
                    descriptionDoc: item.descriptionDoc ? JSON.stringify(item.descriptionDoc) : "",
                  }}
                />
              </EditDisclosure>
              <DeleteButton
                action={deleteEvent.bind(null, community.slug, item.id)}
                confirmText={`Hapus agenda "${item.title}"?`}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
