import { Clock, MapPin } from "lucide-react";
import { Heading } from "@/components/atoms/heading";
import { DateTile } from "@/components/molecules/date-tile";
import { DeleteButton } from "@/components/molecules/delete-button";
import { EditDisclosure } from "@/components/molecules/edit-disclosure";
import { EmptyState } from "@/components/molecules/empty-state";
import { FormPanel } from "@/components/molecules/form-panel";
import { MetaItem } from "@/components/molecules/meta-item";
import { PageHeader } from "@/components/molecules/page-header";
import { AdminListItem } from "@/components/organisms/admin-list-item";
import { AdminSplit } from "@/components/templates/admin-split";
import { requireMember } from "@/lib/access";
import { asTimeZone, calendarTile, formatDateTime, startOfToday, TIME_ZONES, toLocalInput } from "@/lib/datetime";
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
  const today = startOfToday(zone);
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
    <>
      <PageHeader title="Agenda" description="Jadwal rapat dan kegiatan. Agenda yang sudah lewat tidak tampil di halaman warga." />
      <AdminSplit
        form={
          <FormPanel title="Tambah agenda">
            <EventForm slug={community.slug} zoneLabel={zoneLabel} />
          </FormPanel>
        }
        list={
          <>
            <Heading>Agenda ({items.length})</Heading>
            {items.length === 0 && <EmptyState>Belum ada agenda.</EmptyState>}
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <AdminListItem
                  key={item.id}
                  lead={<DateTile {...calendarTile(item.startsAt, zone)} muted={item.startsAt < today} />}
                  title={item.title}
                  meta={
                    <>
                      <MetaItem icon={Clock}>{formatDateTime(item.startsAt, zone)}</MetaItem>
                      {item.location && <MetaItem icon={MapPin}>{item.location}</MetaItem>}
                    </>
                  }
                  action={
                    <DeleteButton
                      action={deleteEvent.bind(null, community.slug, item.id)}
                      confirmText={`Hapus agenda "${item.title}"?`}
                    />
                  }
                >
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
                </AdminListItem>
              ))}
            </ul>
          </>
        }
      />
    </>
  );
}
