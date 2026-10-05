import { Globe, Lock } from "lucide-react";
import { Chip } from "@/components/atoms/chip";

// How visible a piece of content is: draft, public, or public behind a password.
export function StatusChip({ status }: { status: "draft" | "public" | "protected" }) {
  if (status === "public")
    return (
      <Chip tone="green" icon={Globe}>
        Publik
      </Chip>
    );
  if (status === "protected")
    return (
      <Chip tone="amber" icon={Lock}>
        Dilindungi
      </Chip>
    );
  return <Chip>Draft</Chip>;
}
