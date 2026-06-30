"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toggleBotGlobal } from "@/lib/actions/app-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type BotStatusCardProps = {
  enabled: boolean;
  updatedAt: string;
  canToggle: boolean;
};

export function BotStatusCard({ enabled, updatedAt, canToggle }: BotStatusCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localEnabled, setLocalEnabled] = useState(enabled);

  useEffect(() => {
    setLocalEnabled(enabled);
  }, [enabled]);

  function handleToggle(checked: boolean) {
    setLocalEnabled(checked);
    startTransition(async () => {
      try {
        await toggleBotGlobal(checked);
        toast.success(checked ? "Bot activado" : "Bot pausado");
        router.refresh();
      } catch {
        setLocalEnabled(enabled);
        toast.error("No se pudo actualizar el estado del bot");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Estado del bot</CardTitle>
        {localEnabled ? (
          <Bot className="size-5 text-emerald-600" />
        ) : (
          <Pause className="size-5 text-red-600" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-2xl font-bold ${localEnabled ? "text-emerald-600" : "text-red-600"}`}
            >
              {localEnabled ? "Bot activo" : "Bot pausado"}
            </p>
            <p className="text-sm text-muted-foreground">
              Actualizado{" "}
              {formatDistanceToNow(new Date(updatedAt), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
          {canToggle && (
            <Switch
              checked={localEnabled}
              disabled={pending}
              onCheckedChange={handleToggle}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
