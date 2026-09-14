"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_ONBOARDING_PATH } from "@/lib/meta/embedded-signup";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("onboarding-error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="space-y-4 rounded-xl border bg-background p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 text-destructive" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">No se pudo mostrar el resultado de Meta</h1>
          <p className="text-sm text-muted-foreground">
            La conexión con WhatsApp puede haberse autorizado, pero esta pantalla falló
            al recargar. Vuelve a Conectar WhatsApp o reintenta.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
        <Button render={<Link href={WHATSAPP_ONBOARDING_PATH} />} variant="outline">
          Ir a Conectar WhatsApp
        </Button>
        <Button render={<Link href="/app/dashboard" />} variant="ghost">
          Ir al dashboard
        </Button>
      </div>
    </div>
  );
}
