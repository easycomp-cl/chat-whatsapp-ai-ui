"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createAgentAction, updateAgentAction } from "@/lib/actions/app-actions";
import type { BusinessAgent } from "@/types/database.types";

function AgentForm({ agent, onDone }: { agent?: BusinessAgent; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(agent?.name ?? "");
  const [phone, setPhone] = useState(agent?.phone ?? "");
  const [role, setRole] = useState(agent?.role ?? "agent");
  const [notify, setNotify] = useState(agent?.notify_on_handoff ?? true);
  const [active, setActive] = useState(agent?.active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { name, phone, role, notify_on_handoff: notify, active };
    startTransition(async () => {
      try {
        if (agent) await updateAgentAction(agent.id, data);
        else await createAgentAction(data);
        toast.success(agent ? "Agente actualizado" : "Agente creado");
        onDone();
      } catch {
        toast.error("Error al guardar agente");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Rol</Label><Input value={role} onChange={(e) => setRole(e.target.value)} /></div>
      <div className="flex items-center gap-2"><Switch checked={notify} onCheckedChange={setNotify} /><Label>Notificar en derivación</Label></div>
      {agent && <div className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} /><Label>Activo</Label></div>}
      <Button type="submit" disabled={pending}>Guardar</Button>
    </form>
  );
}

export function AgentsManager({ agents }: { agents: BusinessAgent[] }) {
  const [open, setOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<BusinessAgent | null>(null);

  return (
    <div className="space-y-4">
      <Button onClick={() => { setEditAgent(null); setOpen(true); }}>
        <Plus className="size-4" /> Crear agente
      </Button>

      <Dialog open={open || !!editAgent} onOpenChange={(v) => { setOpen(v); if (!v) setEditAgent(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editAgent ? "Editar agente" : "Nuevo agente"}</DialogTitle></DialogHeader>
          <AgentForm agent={editAgent ?? undefined} onDone={() => { setOpen(false); setEditAgent(null); }} />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Notificaciones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>{agent.name}</TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell>{agent.role}</TableCell>
                <TableCell>{agent.notify_on_handoff ? "Sí" : "No"}</TableCell>
                <TableCell><Badge variant={agent.active ? "default" : "secondary"}>{agent.active ? "Activo" : "Inactivo"}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setEditAgent(agent)}>
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
