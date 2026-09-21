"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isNeedsBillingCheckout } from "@/lib/billing/pending-selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";

const fieldClassName =
  "h-11 rounded-xl border-transparent bg-[#ecfdf8] px-3.5 text-[#202022] placeholder:text-[#5c5f6b]/60 focus-visible:border-[#22d3a3]/50 focus-visible:ring-[#22d3a3]/25";

function queryErrorMessage(code: string | undefined): string | null {
  if (code === "inactive") {
    return "Tu cuenta aún no está activa. Contacta al administrador.";
  }
  if (code === "no_business") {
    return "No tienes un negocio asignado.";
  }
  return null;
}

function getLoginErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Confirma tu email antes de iniciar sesión.";
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
    default:
      return message === "Invalid login credentials"
        ? "Email o contraseña incorrectos."
        : message;
  }
}

type LoginFormProps = {
  registered?: boolean;
  errorCode?: string;
  redirectTo?: string;
};

export function LoginForm({
  registered = false,
  errorCode,
  redirectTo,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice] = useState(
    registered ? "Cuenta creada. Inicia sesión para continuar." : null
  );
  const [error, setError] = useState<string | null>(queryErrorMessage(errorCode));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(getLoginErrorMessage(authError.code, authError.message));
      setLoading(false);
      return;
    }

    await isNeedsBillingCheckout();
    const redirect = redirectTo || "/app/dashboard";
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <Logo variant="lockup" size="sm" priority />
      <div className="mt-6 w-full">
        <h1 className="text-2xl font-semibold tracking-tight text-[#202022]">
          Bienvenido de nuevo
        </h1>
        <p className="mt-1.5 text-sm text-[#5c5f6b]">
          Ingresa tu email y contraseña para acceder a {PRODUCT_DISPLAY_NAME}.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#202022]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClassName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#202022]">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClassName} pr-11`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((open) => !open)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#0d9488]/70 transition-colors hover:text-[#0d9488]"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-[#5c5f6b] transition-colors hover:text-[#c4121a] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        {notice && !error ? (
          <p className="text-sm text-emerald-600">{notice}</p>
        ) : null}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-xl bg-[#22d3a3] text-[#04120d] hover:bg-[#22d3a3]/90"
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
        <p className="text-center text-sm text-[#5c5f6b]">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-[#c4121a] underline-offset-2 hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}
