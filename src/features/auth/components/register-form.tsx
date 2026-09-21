"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { registerSchema } from "@/lib/validators/schemas";
import { markNeedsBillingCheckout } from "@/lib/billing/pending-selection";

type RegisterField =
  | "fullName"
  | "businessName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "consent";

const INITIAL_FORM = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  consent: false,
};

function signupErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Ya existe una cuenta con este email. Inicia sesión.";
  }
  if (lower.includes("password")) {
    return "La contraseña no cumple los requisitos. Usa al menos 8 caracteres.";
  }
  if (lower.includes("rate")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  return message || "No se pudo crear la cuenta. Inténtalo de nuevo.";
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ email: string } | null>(null);

  function updateField<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as RegisterField]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const next: Partial<Record<RegisterField, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as RegisterField] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/app/dashboard")}`,
        data: {
          full_name: result.data.fullName,
          business_name: result.data.businessName,
          phone: result.data.phone || null,
          needs_billing: true,
        },
      },
    });

    if (authError) {
      setError(signupErrorMessage(authError.message));
      setSubmitting(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("Ya existe una cuenta con este email. Inicia sesión.");
      setSubmitting(false);
      return;
    }

    if (data.user) markNeedsBillingCheckout(data.user.id);

    if (data.session) {
      router.push("/app/dashboard");
      router.refresh();
      return;
    }

    setDone({ email: result.data.email });
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Logo variant="lockup" size="lg" priority />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Confirma tu email</CardTitle>
            <CardDescription>
              Revisa {done.email} y confirma el correo para activar el acceso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Después de iniciar sesión configurarás tu negocio, conectarás WhatsApp
              y elegirás el plan.
            </p>
            <Button render={<Link href="/login" />} className="w-full" size="lg">
              Ir a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <Logo variant="lockup" size="lg" priority />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate en {PRODUCT_DISPLAY_NAME}. Después configurarás tu negocio,
            WhatsApp y el plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName">Tu nombre</Label>
              <Input
                id="fullName"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                aria-invalid={!!fieldErrors.fullName}
                required
              />
              {fieldErrors.fullName ? (
                <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                autoComplete="organization"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                aria-invalid={!!fieldErrors.businessName}
                required
              />
              {fieldErrors.businessName ? (
                <p className="text-sm text-destructive">{fieldErrors.businessName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                aria-invalid={!!fieldErrors.email}
                required
              />
              {fieldErrors.email ? (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                aria-invalid={!!fieldErrors.password}
                required
              />
              {fieldErrors.password ? (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                aria-invalid={!!fieldErrors.confirmPassword}
                required
              />
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.consent}
                onChange={(e) => updateField("consent", e.target.checked)}
              />
              <span>
                Acepto la{" "}
                <Link
                  href="/politica-de-privacidad"
                  className="underline underline-offset-2 hover:text-foreground"
                  target="_blank"
                >
                  política de privacidad
                </Link>
                .
              </span>
            </label>
            {fieldErrors.consent ? (
              <p className="text-sm text-destructive">{fieldErrors.consent}</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
