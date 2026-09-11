"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn, SectionHeader } from "./landing-motion";
import { LANDING_CONTACT_EMAIL } from "@/lib/landing/constants";
import { trackLandingEvent } from "@/lib/landing/analytics";
import {
  submitDemoRequest,
  type DemoRequestInput,
} from "@/lib/landing/demo-request";
import { cn } from "@/lib/utils";

const VOLUME_OPTIONS = [
  "Menos de 50 al mes",
  "50 a 200 al mes",
  "200 a 500 al mes",
  "Más de 500 al mes",
] as const;

const INITIAL: DemoRequestInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  conversationVolume: "",
  mainProblem: "",
  consent: false,
};

export function DemoCTASection() {
  const [form, setForm] = useState<DemoRequestInput>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof DemoRequestInput, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function updateField<K extends keyof DemoRequestInput>(
    key: K,
    value: DemoRequestInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrors({});
    trackLandingEvent("demo_form_submitted");

    const result = await submitDemoRequest(form);
    if (result.ok) {
      setStatus("success");
      setMessage(result.message);
      setForm(INITIAL);
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  }

  return (
    <section
      id="demo"
      className="scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <SectionHeader
            title="Tus clientes ya están escribiendo. Ayúdalos a recibir una mejor respuesta."
            description="Descubre cómo easycomp-chat-bot-manager puede ordenar las conversaciones de tu negocio y ayudar a tu equipo a atender con mayor rapidez y contexto."
          />

          <FadeIn>
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-md sm:p-8">
              {status === "success" ? (
                <div
                  role="status"
                  className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-800"
                >
                  {message}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-name">Nombre</Label>
                      <Input
                        id="demo-name"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        onFocus={() => trackLandingEvent("demo_form_started")}
                        required
                        aria-invalid={!!errors.name}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-company">Empresa</Label>
                      <Input
                        id="demo-company"
                        value={form.company}
                        onChange={(e) => updateField("company", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-email">Correo</Label>
                      <Input
                        id="demo-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-phone">
                        Teléfono <span className="text-muted-foreground">(opcional)</span>
                      </Label>
                      <Input
                        id="demo-phone"
                        type="tel"
                        value={form.phone ?? ""}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="demo-volume">Conversaciones aproximadas al mes</Label>
                    <Select
                      value={form.conversationVolume}
                      onValueChange={(v) => updateField("conversationVolume", v ?? "")}
                    >
                      <SelectTrigger id="demo-volume" className="w-full">
                        <SelectValue placeholder="Selecciona un rango" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLUME_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="demo-problem">Principal problema de atención</Label>
                    <Textarea
                      id="demo-problem"
                      rows={3}
                      value={form.mainProblem}
                      onChange={(e) => updateField("mainProblem", e.target.value)}
                      placeholder="Ej: perdemos consultas porque respondemos tarde"
                      required
                    />
                  </div>

                  <label className="flex items-start gap-3 text-sm text-[var(--landing-muted)]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.consent}
                      onChange={(e) => updateField("consent", e.target.checked)}
                    />
                    <span>
                      Acepto ser contactado para coordinar una demostración de easycomp-chat-bot-manager.
                    </span>
                  </label>

                  {status === "error" && message ? (
                    <p role="alert" className="text-sm text-destructive">
                      {message}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      disabled={status === "loading"}
                      onClick={() => trackLandingEvent("final_demo_clicked")}
                      className="h-11 flex-1 bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent)]/90"
                    >
                      {status === "loading" ? "Enviando…" : "Solicitar una demostración"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      render={
                        <Link
                          href={`mailto:${LANDING_CONTACT_EMAIL}?subject=${encodeURIComponent("Consulta easycomp-chat-bot-manager")}`}
                        />
                      }
                      className="h-11 flex-1"
                    >
                      Hablar con el equipo
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
