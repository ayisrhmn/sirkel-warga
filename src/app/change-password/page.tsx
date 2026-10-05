import { requireUser } from "@/lib/session";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Ganti password</h1>
      {user.mustChangePassword && (
        <p className="text-neutral-600">
          Password awalmu dari super admin harus diganti sebelum lanjut.
        </p>
      )}
      <ChangePasswordForm />
    </main>
  );
}
