import { CircleHelp } from "lucide-react";
import { StatusPage } from "@/components/templates/status-page";

// The friendly "wrong link" message. Rendered directly (not through
// notFound()) where warga are likely to land with a mistyped link: Next.js
// serves notFound() inside a matched route as an empty shell that only fills
// in once JavaScript has run, which is bad on a slow phone.
export function CommunityNotFound() {
  return (
    <StatusPage icon={CircleHelp} title="Komunitas tidak ditemukan">
      Cek lagi link dari pengurus.
    </StatusPage>
  );
}
