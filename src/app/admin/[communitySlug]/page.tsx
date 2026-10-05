import { requireMember } from "@/lib/access";

export default async function CommunityAdminPage({
  params,
}: PageProps<"/admin/[communitySlug]">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);

  return (
    <main className="flex flex-col gap-2">
      <p>
        Link untuk dibagikan ke warga:{" "}
        <span className="font-mono">/{community.slug}</span>
      </p>
      <p className="text-neutral-600 dark:text-neutral-400">
        Pengelolaan pengumuman, agenda, dan kontak menyusul.
      </p>
    </main>
  );
}
