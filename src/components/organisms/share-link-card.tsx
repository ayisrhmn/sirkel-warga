import { ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/atoms/button";
import { Ring } from "@/components/atoms/ring";
import { CopyButton } from "@/components/molecules/copy-button";

// The link admins hand out to residents, with copy and open buttons.
export function ShareLinkCard({ slug }: { slug: string }) {
  return (
    <div className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-3xl bg-primary-dark p-7 text-white sm:p-8">
      <Ring className="-top-32 -right-20 size-80" />
      <Ring className="-top-14 right-2 size-48" />
      <div className="relative flex flex-col gap-2.5">
        <p className="text-[15px] font-semibold text-white/75">Link untuk dibagikan ke warga</p>
        <p className="font-mono text-2xl font-semibold break-all sm:text-[28px]">/{slug}</p>
      </div>
      <div className="relative flex flex-wrap gap-3">
        <CopyButton path={`/${slug}`} variant="light" />
        <ButtonLink href={`/${slug}`} variant="light-ghost" icon={ExternalLink}>
          Buka
        </ButtonLink>
      </div>
    </div>
  );
}
