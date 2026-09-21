"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  loadSetupStatusAction,
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
  const [linkSent, setLinkSent] = useState(false);
  const [pendingSend, startSend] = useTransition();
  const [pendingCheck, startCheck] = useTransition();

  useEffect(() => {
    setLinkSent(false);
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
            "El aviso se envía con una plantilla de WhatsApp. Hace falta conectar WhatsApp del negocio y que Meta apruebe la plantilla.",
        });
        return;
      }
      setLinkSent(true);
      toast.success("Te enviamos un WhatsApp. Toca Confirmar en ese mensaje.");
    });
  }

  function handleAlreadyConfirmed() {
    startCheck(async () => {
      const result = await loadSetupStatusAction(businessId);
      if (!result.ok) {
        toast.error("No se pudo consultar el estado. Intenta de nuevo.");
        return;
      }
      const verifiedAtFromStatus = result.status.draft?.human_contact?.admin_phone_verified_at ?? null;
      if (!verifiedAtFromStatus) {
        toast.error("Todavía no está confirmado. Toca Confirmar en el WhatsApp y vuelve a intentar.");
        return;
      }
      updateContact({ admin_phone_verified_at: verifiedAtFromStatus });
      toast.success("Número confirmado. Ya puede recibir avisos de derivación.");
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
              WhatsApp no deja mandar un mensaje libre a un celular que no te escribió. Te
              enviamos un aviso con un botón Confirmar.
            </p>
          </div>

          <div className="rounded-lg border bg-[#efeae2] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#667781]">
              Plantilla de confirmación
            </p>
            <p className="mt-2 text-sm text-[#111b21]">
              Hola María, fuiste agregado al equipo de EasyComp Repuestos. Confirma que este
              número es correcto.
            </p>
            <p className="mt-2 text-xs font-medium text-[#0d9488]">Confirmar</p>
          </div>

          {verifiedAt ? (
            <p className="text-sm font-medium text-emerald-700">
              Número confirmado. Los avisos de derivación pueden llegar a este WhatsApp.
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
                  {pendingSend ? "Enviando…" : "Enviar confirmación por WhatsApp"}
                </Button>
                {linkSent ? (
                  <Button
                    type="button"
                    onClick={handleAlreadyConfirmed}
                    disabled={pendingCheck}
                    className="bg-[#0d9488] text-white hover:bg-[#0d9488]/90"
                  >
                    {pendingCheck ? "Revisando…" : "Ya confirmé"}
                  </Button>
                ) : null}
              </div>
              {linkSent ? (
                <p className="text-xs text-muted-foreground">
                  Abre el WhatsApp de ese número, toca Confirmar y luego pulsa Ya confirmé.
                </p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Puedes seguir al siguiente paso y validar después de conectar WhatsApp. Hasta que
                el número esté confirmado, no se enviarán avisos de derivación.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
