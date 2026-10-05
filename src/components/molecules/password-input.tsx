"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { inputClass } from "@/components/form-styles";

// A password field with an eye button to show or hide what was typed, so
// people who are unsure about their typing (common on a phone keyboard) can
// check it.
export function PasswordInput(props: Omit<React.ComponentProps<"input">, "type" | "className">) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;

  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={`${inputClass} pr-12`} />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-pressed={shown}
        aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
        title={shown ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-600"
      >
        <Icon aria-hidden="true" size={20} />
      </button>
    </div>
  );
}
