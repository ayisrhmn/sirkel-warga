"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Input } from "@/components/atoms/input";

// A password field with an eye button to show or hide what was typed, so
// people who are unsure about their typing (common on a phone keyboard) can
// check it.
export function PasswordInput(props: Omit<ComponentProps<"input">, "type" | "className">) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pr-14" />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-pressed={shown}
        aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
        title={shown ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 flex w-13 cursor-pointer items-center justify-center text-muted"
      >
        <Icon aria-hidden="true" size={22} />
      </button>
    </div>
  );
}
