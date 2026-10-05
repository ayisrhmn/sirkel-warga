import { Avatar } from "@/components/atoms/avatar";
import { LogoMark } from "@/components/atoms/logo";

// The admin header on a phone: which community this is, and who is signed in.
export function AdminTopBar({ communityName, userName }: { communityName: string; userName: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark size={30} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">Panel pengurus</p>
          <p className="truncate font-bold text-ink">{communityName}</p>
        </div>
      </div>
      <Avatar name={userName} size="sm" />
    </header>
  );
}
