import type { FormState } from "@/lib/form-state";

// The result line under a form: an error (announced to screen readers) or a
// success note.
export function FormMessage({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="text-sm font-medium text-primary">
        {state.ok}
      </p>
    );
  return null;
}
