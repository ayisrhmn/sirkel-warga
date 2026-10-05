import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Banner } from "@/components/molecules/banner";
import { AdminBottomNav } from "@/components/organisms/admin-bottom-nav";
import { AdminSidebar } from "@/components/organisms/admin-sidebar";
import { AdminTopBar } from "@/components/organisms/admin-top-bar";
import { AdminLayout } from "@/components/templates/admin-layout";
import { requireMember } from "@/lib/access";

export default async function CommunityAdminLayout({
  children,
  params,
}: LayoutProps<"/admin/[communitySlug]">) {
  const { communitySlug } = await params;
  const { user, community, role, forced } = await requireMember(communitySlug);
  const owner = role === "owner";
  const roleLabel = forced ? "Platform admin" : owner ? "Super admin" : "Admin";

  return (
    <AdminLayout
      sidebar={
        <AdminSidebar
          community={community}
          roleLabel={roleLabel}
          owner={owner}
          forced={forced}
          isPlatformAdmin={user.isPlatformAdmin}
          user={user}
        />
      }
      topBar={<AdminTopBar communityName={community.name} userName={user.name} />}
      bottomNav={<AdminBottomNav slug={community.slug} owner={owner} isPlatformAdmin={user.isPlatformAdmin} />}
      banner={
        forced && (
          <Banner tone="warning" icon={ShieldCheck}>
            <strong>Akses paksa platform admin.</strong> Kamu bukan anggota komunitas ini.
            Perubahan yang kamu buat berlaku langsung.{" "}
            <Link href="/platform" className="font-bold underline">
              Kembali ke daftar komunitas
            </Link>
          </Banner>
        )
      }
    >
      {children}
    </AdminLayout>
  );
}
