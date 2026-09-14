"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WHATSAPP_ONBOARDING_PATH } from "@/lib/meta/embedded-signup";

type WhatsappConnectionCardProps = {
  connected: boolean;
  phoneNumber?: string | null;
  phoneNumberId?: string | null;
};

export function WhatsappConnectionCard({
  connected,
  phoneNumber,
  phoneNumberId,
}: WhatsappConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>WhatsApp Business</CardTitle>
            <CardDescription>
              Canal de Meta para enviar y recibir mensajes del bot.
            </CardDescription>
          </div>
          <Badge
            variant={connected ? "default" : "outline"}
            className={connected ? "bg-emerald-600 text-white" : undefined}
          >
            {connected ? "Conectado" : "Sin conectar"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {connected
            ? `Número: ${phoneNumber || phoneNumberId || "conectado"}`
            : "Conecta el WhatsApp del negocio con Embedded Signup de Meta."}
        </p>
        <Button
          render={<Link href={WHATSAPP_ONBOARDING_PATH} />}
          className={connected ? undefined : "bg-[#1877F2] text-white hover:bg-[#1877F2]/90"}
          variant={connected ? "outline" : "default"}
        >
          <Smartphone />
          {connected ? "Ver conexión" : "Conectar WhatsApp"}
        </Button>
      </CardContent>
    </Card>
  );
}
