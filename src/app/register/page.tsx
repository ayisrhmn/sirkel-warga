import Link from "next/link";
import { Heading } from "@/components/atoms/heading";
import { Banner } from "@/components/molecules/banner";
import { AuthLayout } from "@/components/templates/auth-layout";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Heading as="h1" size="page">
        Daftar pengurus
      </Heading>
      <Banner>Akunmu perlu disetujui dulu sebelum bisa masuk.</Banner>
      <RegisterForm />
      <p className="text-[15px] text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-primary underline">
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}
