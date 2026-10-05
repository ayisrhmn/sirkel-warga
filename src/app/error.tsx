"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/atoms/button";
import { StatusPage } from "@/components/templates/status-page";

// Shown instead of a raw error when something unexpected fails (for example
// the database is waking up). The details only go to the server log.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={TriangleAlert}
      tone="amber"
      title="Terjadi kesalahan"
      action={
        <Button icon={RefreshCw} onClick={() => retry()} className="mt-2">
          Coba lagi
        </Button>
      }
    >
      Halaman gagal dimuat. Coba lagi sebentar. Kalau masih gagal, hubungi
      pengurus.
    </StatusPage>
  );
}
