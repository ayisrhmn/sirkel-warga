// Result of a Server Action used with useActionState. `values` echoes the
// non-secret fields so the form keeps them after an error (React 19 resets
// uncontrolled fields once an action finishes).
export type FormState = {
  error?: string;
  ok?: string;
  values?: Record<string, string>;
};
