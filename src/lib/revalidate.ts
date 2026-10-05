import { revalidatePath, updateTag } from "next/cache";
import { communityTag } from "@/lib/communities";

// Refreshes the public page of a community right after an admin change.
export function revalidateCommunity(slug: string) {
  updateTag(communityTag(slug));
  revalidatePath(`/${slug}`);
}
