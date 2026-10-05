import { Archive, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/atoms/card";
import { Container } from "@/components/atoms/container";
import { Heading } from "@/components/atoms/heading";
import { IconTile } from "@/components/atoms/icon-tile";
import { Wordmark } from "@/components/atoms/logo";
import { countCommunitiesOfUser } from "@/lib/queries/accounts";
import { requireUser } from "@/lib/session";
import { CreateCommunityForm } from "./create-community-form";
import { RestoreForm } from "./restore-form";

export default async function CreateCommunityPage() {
  const user = await requireUser();
  // The operator manages communities from /platform; they never create one.
  if (user.isPlatformAdmin) redirect("/platform");
  // Each account belongs to one community: created admins to the one that
  // made them, everyone else to the one they create here.
  if ((await countCommunitiesOfUser(user.id)) > 0) redirect("/admin");

  return (
    <Container className="max-w-5xl pb-16">
      <div className="py-5">
        <Wordmark />
      </div>
      <main className="flex flex-col gap-7 pt-4">
        <Heading as="h1" size="page">
          Buat komunitas
        </Heading>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card padding="lg" className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <IconTile icon={Users} />
              <Heading>Komunitas baru</Heading>
            </div>
            <CreateCommunityForm />
          </Card>
          <section className="flex flex-col gap-5 rounded-3xl border-2 border-dashed border-line-strong p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <IconTile icon={Archive} tone="amber" />
              <Heading>Atau pulihkan dari cadangan</Heading>
            </div>
            <p className="text-[15px] text-muted">
              Untuk komunitas yang terhapus. Isinya (pengumuman, agenda, kontak,
              laporan) kembali, tapi password laporan dilindungi dan akun admin
              perlu dibuat ulang.
            </p>
            <RestoreForm />
          </section>
        </div>
      </main>
    </Container>
  );
}
