import Link from "next/link";
import { Heading } from "@/components/atoms/heading";
import { AuthLayout } from "@/components/templates/auth-layout";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Heading as="h1" size="page">
        Login pengurus
      </Heading>
      <LoginForm />
      <p className="text-[15px] text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-bold text-primary underline">
          Daftar
        </Link>
      </p>
    </AuthLayout>
  );
}
