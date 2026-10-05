import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DataTable } from "@/components/data-table";
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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8">
      <Link href={`/${communitySlug}`} className="w-fit text-sm underline">
        {result.communityName}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{result.title}</h1>
        {result.period && (
          <p className="text-neutral-600">{result.period}</p>
        )}
      </div>
      {result.state === "open" ? (
        <DataTable columns={result.columns} rows={result.rows} />
      ) : result.hasPassword ? (
        <>
          <p>Laporan ini dilindungi password. Tanyakan password-nya ke pengurus.</p>
          <UnlockForm slug={communitySlug} id={id} />
        </>
      ) : (
        <p>Pengurus belum menetapkan password untuk laporan ini.</p>
      )}
    </main>
  );
}
