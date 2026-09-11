"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { retryFlowWebhookDeliveryAction } from "@/lib/actions/flow-actions";
import { FLOW_WEBHOOK_DELIVERY_STATUS_LABELS } from "@/lib/flows/utils";
import type { FlowWebhookDelivery } from "@/lib/bot-api/types";

export function FlowDeliveriesTable({
  deliveries,
  flowRunId,
}: {
  deliveries: FlowWebhookDelivery[];
  flowRunId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const filtered = flowRunId
    ? deliveries.filter((d) => d.flow_run_id === flowRunId)
    : deliveries;

  function handleRetry(deliveryId: string) {
    startTransition(async () => {
      try {
        await retryFlowWebhookDeliveryAction(deliveryId);
        toast.success("Reintento programado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al reintentar");
      }
    });
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Intentos</TableHead>
            <TableHead>HTTP</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay entregas registradas
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-mono text-xs">{delivery.event_type}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      delivery.status === "DELIVERED"
                        ? "default"
                        : delivery.status === "FAILED" || delivery.status === "DEAD_LETTER"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {FLOW_WEBHOOK_DELIVERY_STATUS_LABELS[delivery.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {delivery.attempt_count}/{delivery.max_attempts}
                </TableCell>
                <TableCell>{delivery.last_http_status ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(delivery.created_at).toLocaleString("es-CL")}
                </TableCell>
                <TableCell className="text-right">
                  {(delivery.status === "FAILED" || delivery.status === "DEAD_LETTER") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleRetry(delivery.id)}
                    >
                      <RefreshCw className="size-4" />
                      Reintentar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
