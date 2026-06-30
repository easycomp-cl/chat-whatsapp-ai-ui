"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activateProfileAction } from "@/lib/actions/app-actions";
import type { Profile } from "@/types/database.types";
import { useState } from "react";

export function ActivateProfileForm({
  businessId,
  profiles,
  agents,
}: {
  businessId: string;
  profiles: Profile[];
  agents: Array<{ id: string; name: string }>;
}) {
  const [selectedProfile, setSelectedProfile] = useState("");
  const [role, setRole] = useState<"BUSINESS_ADMIN" | "AGENT">("BUSINESS_ADMIN");
  const [agentId, setAgentId] = useState("");
  const [pending, startTransition] = useTransition();

  const inactiveProfiles = profiles.filter((p) => !p.active || !p.business_id);

  function handleActivate() {
    if (!selectedProfile) return;
    startTransition(async () => {
      try {
        await activateProfileAction(
          selectedProfile,
          businessId,
          role,
          role === "AGENT" ? agentId : undefined
        );
        toast.success("Usuario activado");
      } catch {
        toast.error("Error al activar usuario");
      }
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Asignar usuarios</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Usuario pendiente</Label>
          <Select value={selectedProfile} onValueChange={(v) => setSelectedProfile(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
            <SelectContent>
              {inactiveProfiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name ?? p.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rol</Label>
          <Select value={role} onValueChange={(v) => setRole((v ?? "BUSINESS_ADMIN") as "BUSINESS_ADMIN" | "AGENT")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BUSINESS_ADMIN">Business Admin</SelectItem>
              <SelectItem value="AGENT">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {role === "AGENT" && (
          <div className="space-y-2">
            <Label>Agente vinculado</Label>
            <Select value={agentId} onValueChange={(v) => setAgentId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar agente" /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={handleActivate} disabled={pending || !selectedProfile}>
          Activar usuario
        </Button>
      </CardContent>
    </Card>
  );
}
