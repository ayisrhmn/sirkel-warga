import { Avatar } from "@/components/atoms/avatar";
import { WhatsAppIcon } from "@/components/atoms/whatsapp-icon";

// A person to call, with a one-tap WhatsApp button. The number stays visible
// because many people want to read or copy it.
export function ContactCard({ name, role, phone, whatsappHref }: { name: string; role: string; phone: string; whatsappHref: string }) {
  return (
    <article className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <h3 className="leading-snug font-bold text-ink">{name}</h3>
        <p className="text-sm text-muted">{role}</p>
        <p className="text-sm text-body tabular-nums">{phone}</p>
      </div>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat WhatsApp ${name}, ${phone}`}
        className="flex size-13 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark"
      >
        <WhatsAppIcon aria-hidden="true" size={26} />
      </a>
    </article>
  );
}
