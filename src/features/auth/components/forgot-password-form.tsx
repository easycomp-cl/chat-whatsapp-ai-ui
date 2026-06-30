"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?next=/login` }
    );

    if (authError) {
      setError(authError.message);
    } else {
      setMessage("Revisa tu email para restablecer la contraseña.");
    }
    setLoading(false);
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <Logo size="lg" />
      <Card className="w-full">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Te enviaremos un enlace para restablecer tu acceso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>
          <Link
            href="/login"
            className="block text-center text-sm text-muted-foreground hover:underline"
          >
            Volver al login
          </Link>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
