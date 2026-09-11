"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { publishFlowVersionAction } from "@/lib/actions/flow-actions";
import { FlowSimulatorPanel } from "@/features/flows/components/flow-simulator-panel";
import { FlowEditorPanel } from "@/features/flows/components/editor/flow-editor-panel";
import { FlowWebhookSettings } from "@/features/flows/components/flow-webhook-settings";
import { FlowDeliveriesTable } from "@/features/flows/components/flow-deliveries-table";
import { hasBlockingFlowErrors, validateFlowGraph } from "@/lib/flows/graph-validation";
import type { FlowDefinitionGraph } from "@/lib/flows/graph-types";
import type {
  FlowDefinition,
  FlowVersion,
  FlowWebhookDelivery,
  FlowWebhookIntegration,
} from "@/lib/bot-api/types";

export function FlowDetailPageContent({
  flow,
  versions,
  webhookIntegration,
  deliveries,
}: {
  flow: FlowDefinition;
  versions: FlowVersion[];
  webhookIntegration: FlowWebhookIntegration;
  deliveries: FlowWebhookDelivery[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const draftVersions = versions.filter((v) => v.status === "DRAFT");

  function handlePublish(versionId: string) {
    const version = versions.find((v) => v.id === versionId);
    if (version?.graph_json && typeof version.graph_json === "object") {
      const issues = validateFlowGraph(version.graph_json as FlowDefinitionGraph);
      if (hasBlockingFlowErrors(issues)) {
        toast.error(
          `No se puede publicar: hay ${issues.filter((i) => i.severity === "error").length} error(es). Revisa el editor.`
        );
        return;
      }
    }

    if (!confirm("¿Publicar esta versión? Los clientes podrán activar el flujo.")) return;
    startTransition(async () => {
      try {
        await publishFlowVersionAction(flow.id, versionId);
        toast.success("Versión publicada");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al publicar");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{flow.name}</h2>
          {flow.description && (
            <p className="text-sm text-muted-foreground">{flow.description}</p>
          )}
        </div>
        <Badge>{flow.status}</Badge>
      </div>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="versions">Versiones</TabsTrigger>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <FlowEditorPanel flowId={flow.id} versions={versions} />
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Publicada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>v{version.version_number}</TableCell>
                    <TableCell>
                      <Badge variant={version.status === "PUBLISHED" ? "default" : "secondary"}>
                        {version.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {version.published_at
                        ? new Date(version.published_at).toLocaleString("es-CL")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {version.status === "DRAFT" && (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => handlePublish(version.id)}
                        >
                          Publicar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {draftVersions.some((v) =>
            v.triggers?.some((t) => t.trigger_type === "WEBHOOK")
          ) && (
            <p className="text-xs text-muted-foreground">
              Este flujo incluye trigger webhook. Al publicar se sincroniza el secreto del trigger.
            </p>
          )}
        </TabsContent>

        <TabsContent value="simulator">
          <FlowSimulatorPanel flowId={flow.id} versions={versions} />
        </TabsContent>

        <TabsContent value="webhook">
          <FlowWebhookSettings integration={webhookIntegration} />
        </TabsContent>

        <TabsContent value="deliveries">
          <FlowDeliveriesTable deliveries={deliveries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
