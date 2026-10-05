"use client";

import { useState } from "react";
import { inputClass } from "@/components/form-styles";

// A password field with a button to show or hide what was typed, so people
// who are unsure about their typing (common on a phone keyboard) can check.
export function PasswordInput(props: Omit<React.ComponentProps<"input">, "type" | "className">) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={`${inputClass} pr-28`} />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-pressed={shown}
        aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 px-3 text-sm underline"
      >
        {shown ? "Sembunyikan" : "Tampilkan"}
      </button>
    </div>
  );
}
