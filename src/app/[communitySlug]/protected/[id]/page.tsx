import { CalendarDays, Lock } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/atoms/card";
import { Chip } from "@/components/atoms/chip";
import { Heading } from "@/components/atoms/heading";
import { IconTile } from "@/components/atoms/icon-tile";
import { DataTable } from "@/components/organisms/data-table";
import { PublicPage } from "@/components/templates/public-page";
import { requireUuid } from "@/lib/form";
import { getProtectedDataset } from "@/lib/protected-dataset";
import { SLUG_RE } from "@/lib/slug";
import { UnlockForm } from "./unlock-form";

// Never cached or prerendered: the content depends on the visitor's cookie.
export const dynamic = "force-dynamic";

export default async function ProtectedDatasetPage({
  params,
}: PageProps<"/[communitySlug]/protected/[id]">) {
  const { communitySlug, id } = await params;
  if (!SLUG_RE.test(communitySlug)) notFound();
  requireUuid(id);

  const result = await getProtectedDataset(communitySlug, id);
  if (result.state === "not-found") notFound();
  if (result.state === "public") redirect(`/${communitySlug}/datasets/${id}`);

  return (
    <PublicPage size="content" themeColor={result.primaryColor} back={{ href: `/${communitySlug}`, label: result.communityName }}>
      <div className="flex flex-wrap gap-2.5">
        <Chip tone="amber" icon={Lock}>
          Dilindungi
        </Chip>
        {result.period && <Chip icon={CalendarDays}>{result.period}</Chip>}
      </div>
      <Heading as="h1" size="hero" className="text-4xl sm:text-5xl">
        {result.title}
      </Heading>
      {result.state === "open" ? (
        <DataTable columns={result.columns} rows={result.rows} fills={result.fills} />
      ) : (
        <Card padding="lg" className="mx-auto mt-4 flex w-full max-w-md flex-col gap-5 shadow-xl shadow-ink/10">
          <IconTile icon={Lock} tone="amber" size="lg" />
          <Heading>Laporan ini dilindungi</Heading>
          {result.hasPassword ? (
            <>
              <p className="text-body">Laporan ini dilindungi password. Tanyakan password-nya ke pengurus.</p>
              <UnlockForm slug={communitySlug} id={id} />
            </>
          ) : (
            <p className="text-body">Pengurus belum menetapkan password untuk laporan ini.</p>
          )}
        </Card>
      )}
    </PublicPage>
  );
}
