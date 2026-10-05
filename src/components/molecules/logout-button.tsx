"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, type ButtonStyle } from "@/components/atoms/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ variant = "ghost", size = "sm", full, align }: Pick<ButtonStyle, "variant" | "size" | "full" | "align">) {
  const router = useRouter();

  async function onClick() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant={variant} size={size} full={full} align={align} icon={LogOut} onClick={onClick}>
      Keluar
    </Button>
  );
}
