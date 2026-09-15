"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  confirmAdminPhoneVerificationAction,
  sendAdminPhoneVerificationAction,
} from "@/lib/actions/app-actions";
import type { OnboardingDraft } from "../../types";

type StepHumanContactProps = {
  businessId: string;
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
};

export function StepHumanContact({ businessId, draft, onChange }: StepHumanContactProps) {
  const contact = draft.human_contact ?? {
    admin_name: "",
    admin_phone: "",
    notify_on_handoff: true,
    admin_phone_verified_at: null,
  };
  const notify = contact.notify_on_handoff ?? true;
  const phone = contact.admin_phone ?? "";
  const verifiedAt = contact.admin_phone_verified_at ?? null;
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [pendingSend, startSend] = useTransition();
  const [pendingConfirm, startConfirm] = useTransition();

  useEffect(() => {
    setCode("");
    setCodeSent(false);
  }, [phone]);

  function updateContact(patch: Partial<typeof contact>) {
    onChange({ human_contact: { ...contact, ...patch } });
  }

  function handleSendCode() {
    const trimmed = phone.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      toast.error("Ingresa un teléfono válido en formato E.164 (ej. +56912345678).");
      return;
    }
    startSend(async () => {
      const result = await sendAdminPhoneVerificationAction(businessId, trimmed);
      if (!result.ok) {
        toast.error(result.error, {
          description:
            "El código se envía con una plantilla de autenticación de WhatsApp. Hace falta conectar WhatsApp del negocio y que Meta apruebe la plantilla.",
        });
        return;
      }
      setCodeSent(true);
      toast.success("Código enviado a tu WhatsApp personal.");
    });
  }

  function handleConfirmCode() {
    const trimmed = phone.trim();
    const otp = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(otp)) {
      toast.error("El código debe tener 6 dígitos.");
      return;
    }
    startConfirm(async () => {
      const result = await confirmAdminPhoneVerificationAction(businessId, trimmed, otp);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      updateContact({ admin_phone_verified_at: result.result.verified_at });
      toast.success("Número verificado. Ya puede recibir avisos de derivación.");
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Cuando el bot no pueda resolver una consulta, derivará la conversación a esta persona.
      </p>

      <div className="space-y-2">
        <Label htmlFor="admin-name">Nombre del responsable</Label>
        <Input
          id="admin-name"
          value={contact.admin_name ?? ""}
          onChange={(e) => updateContact({ admin_name: e.target.value })}
          placeholder="María González"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-phone">Teléfono WhatsApp (E.164)</Label>
        <Input
          id="admin-phone"
          type="tel"
          value={phone}
          onChange={(e) =>
            updateContact({
              admin_phone: e.target.value,
              admin_phone_verified_at: null,
            })
          }
          placeholder="+56912345678"
        />
        <p className="text-xs text-muted-foreground">
          Formato internacional con código de país, ej. +56 para Chile. Debe ser el WhatsApp
          personal, no el número del negocio.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor="notify-handoff" className="text-sm">
            Notificar al derivar conversación
          </Label>
          <p className="text-xs text-muted-foreground">
            Recibirás aviso cuando un cliente necesite atención humana.
          </p>
        </div>
        <Switch
          id="notify-handoff"
          checked={notify}
          onCheckedChange={(checked) => updateContact({ notify_on_handoff: checked })}
        />
      </div>

      {notify && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div>
            <p className="text-sm font-medium">Validar número para avisos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              WhatsApp no deja mandar un mensaje libre a un celular que no te escribió. El código
              de prueba y los avisos de derivación van con plantillas aprobadas por Meta.
            </p>
          </div>

          <div className="rounded-lg border bg-[#efeae2] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#667781]">
              Plantilla de validación (AUTHENTICATION)
            </p>
            <p className="mt-2 text-sm text-[#111b21]">
              Tu código de verificación es <span className="font-semibold">123456</span>. Válido 10
              minutos. No lo compartas.
            </p>
          </div>

          {verifiedAt ? (
            <p className="text-sm font-medium text-emerald-700">
              Número verificado. Los avisos de derivación pueden llegar a este WhatsApp.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={pendingSend}
                >
                  {pendingSend ? "Enviando…" : "Enviar código por WhatsApp"}
                </Button>
              </div>
              {codeSent && (
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">Código de 6 dígitos</Label>
                  <div className="flex gap-2">
                    <Input
                      id="admin-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                    />
                    <Button
                      type="button"
                      onClick={handleConfirmCode}
                      disabled={pendingConfirm}
                      className="bg-[#7678ed] text-white hover:bg-[#7678ed]/90"
                    >
                      {pendingConfirm ? "Confirmando…" : "Confirmar"}
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Puedes seguir al siguiente paso y validar después de conectar WhatsApp. Hasta que
                el número esté verificado, no se enviarán avisos de derivación.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
