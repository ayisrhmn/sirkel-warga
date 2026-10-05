import { Heading } from "@/components/atoms/heading";
import { Banner } from "@/components/molecules/banner";
import { AuthLayout } from "@/components/templates/auth-layout";
import { requireUser } from "@/lib/session";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  return (
    <AuthLayout>
      <Heading as="h1" size="page">
        Ganti password
      </Heading>
      {user.mustChangePassword && (
        <Banner tone="warning">Password awalmu dari super admin harus diganti sebelum lanjut.</Banner>
      )}
      <ChangePasswordForm />
    </AuthLayout>
  );
}
