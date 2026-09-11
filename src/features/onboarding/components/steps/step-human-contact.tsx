"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { OnboardingDraft } from "../../types";

type StepHumanContactProps = {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
};

export function StepHumanContact({ draft, onChange }: StepHumanContactProps) {
  const contact = draft.human_contact ?? {
    admin_name: "",
    admin_phone: "",
    notify_on_handoff: true,
  };

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
          onChange={(e) =>
            onChange({
              human_contact: { ...contact, admin_name: e.target.value },
            })
          }
          placeholder="María González"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-phone">Teléfono WhatsApp (E.164)</Label>
        <Input
          id="admin-phone"
          type="tel"
          value={contact.admin_phone ?? ""}
          onChange={(e) =>
            onChange({
              human_contact: { ...contact, admin_phone: e.target.value },
            })
          }
          placeholder="+56912345678"
        />
        <p className="text-xs text-muted-foreground">
          Formato internacional con código de país, ej. +56 para Chile.
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
          checked={contact.notify_on_handoff ?? true}
          onCheckedChange={(checked) =>
            onChange({
              human_contact: { ...contact, notify_on_handoff: checked },
            })
          }
        />
      </div>
    </div>
  );
}
