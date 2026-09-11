"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Archive, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { archiveFlowAction, createFlowAction } from "@/lib/actions/flow-actions";
import { FLOW_DEFINITION_STATUS_LABELS } from "@/lib/flows/utils";
import type { FlowDefinition } from "@/lib/bot-api/types";

function CreateFlowDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<"wood_quote" | "default">("wood_quote");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const flow = await createFlowAction({ name, description, template });
        toast.success("Flujo creado");
        onOpenChange(false);
        setName("");
        setDescription("");
        router.push(`/app/flujos/${flow.id}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al crear flujo");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo flujo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={template} onValueChange={(v) => setTemplate(v as typeof template)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wood_quote">
                  Cotización de tablas personalizadas
                </SelectItem>
                <SelectItem value="default">Flujo básico (genérico)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {template === "wood_quote"
                ? "Captura medidas, logo, precio y envío — ideal para cotizaciones por WhatsApp."
                : "Plantilla mínima para empezar; puedes publicar y ajustar después."}
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creando..." : "Crear flujo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FlowsManager({
  flows,
  apiError,
}: {
  flows: FlowDefinition[];
  apiError: string | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleArchive(flowId: string, flowName: string) {
    if (!confirm(`¿Archivar el flujo "${flowName}"?`)) return;
    startTransition(async () => {
      try {
        await archiveFlowAction(flowId);
        toast.success("Flujo archivado");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al archivar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo flujo
          </Button>
          <Button variant="outline" render={<Link href="/app/flujos/revisiones" />}>
            <ClipboardList className="size-4" />
            Revisiones
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Versión publicada</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay flujos. Crea uno desde plantilla para empezar.
                </TableCell>
              </TableRow>
            ) : (
              flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell>
                    <Link
                      href={`/app/flujos/${flow.id}`}
                      className="font-medium hover:text-[#7678ed]"
                    >
                      {flow.name}
                    </Link>
                    {flow.description && (
                      <p className="text-xs text-muted-foreground">{flow.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={flow.status === "ACTIVE" ? "default" : "secondary"}>
                      {FLOW_DEFINITION_STATUS_LABELS[flow.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {flow.current_version
                      ? `v${flow.current_version.version_number}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(flow.updated_at).toLocaleDateString("es-CL")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={`/app/flujos/${flow.id}`} />}
                      >
                        Abrir
                      </Button>
                      {flow.status !== "ARCHIVED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => handleArchive(flow.id, flow.name)}
                        >
                          <Archive className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateFlowDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
