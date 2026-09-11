"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { upsertFlowWebhookIntegrationAction } from "@/lib/actions/flow-actions";
import type { FlowWebhookIntegration } from "@/lib/bot-api/types";

export function FlowWebhookSettings({
  integration,
}: {
  integration: FlowWebhookIntegration;
}) {
  const [pending, startTransition] = useTransition();
  const configured = integration.configured === true;
  const [url, setUrl] = useState(configured ? integration.url : "");
  const [enabled, setEnabled] = useState(configured ? integration.enabled : true);
  const [events, setEvents] = useState(
    configured && integration.events?.length
      ? integration.events.join(", ")
      : "quote.confirmed"
  );
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  function handleSave(rotateSecret = false) {
    startTransition(async () => {
      try {
        const result = await upsertFlowWebhookIntegrationAction({
          url,
          enabled,
          events: events
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          rotate_secret: rotateSecret,
        });
        if ("webhook_secret" in result && result.webhook_secret) {
          setRevealedSecret(result.webhook_secret);
          toast.success("Webhook guardado. Copia el secreto ahora; no se volverá a mostrar.");
        } else {
          toast.success("Webhook guardado");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al guardar webhook");
      }
    });
  }

  return (
    <div className="max-w-xl space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <Label>URL del receptor</Label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tu-sistema.com/webhooks/easycomp-chat-bot-manager"
        />
      </div>
      <div className="space-y-2">
        <Label>Eventos (separados por coma)</Label>
        <Input value={events} onChange={(e) => setEvents(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={setEnabled} />
        <Label>Webhook activo</Label>
      </div>
      {configured && integration.has_secret && !revealedSecret && (
        <p className="text-xs text-muted-foreground">
          Ya hay un secreto configurado. Usa &quot;Rotar secreto&quot; para generar uno nuevo.
        </p>
      )}
      {revealedSecret && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="mb-1 font-medium text-amber-900">Secreto (cópialo ahora)</p>
          <code className="break-all text-xs">{revealedSecret}</code>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleSave(false)} disabled={pending || !url}>
          <Save className="size-4" />
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        {configured && (
          <Button variant="outline" onClick={() => handleSave(true)} disabled={pending}>
            <KeyRound className="size-4" />
            Rotar secreto
          </Button>
        )}
      </div>
    </div>
  );
}
