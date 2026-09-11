"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFlowVersionFromSourceAction } from "@/lib/actions/flow-actions";
import { FlowEditor } from "@/features/flows/components/editor/flow-editor";
import type { FlowDefinitionGraph } from "@/lib/flows/graph-types";
import type { FlowVersion } from "@/lib/bot-api/types";

function parseGraph(version: FlowVersion): FlowDefinitionGraph | null {
  if (!version.graph_json || typeof version.graph_json !== "object") return null;
  return version.graph_json as FlowDefinitionGraph;
}

export function FlowEditorPanel({
  flowId,
  versions,
}: {
  flowId: string;
  versions: FlowVersion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const draftVersion = versions.find((v) => v.status === "DRAFT");
  const [activeVersionId, setActiveVersionId] = useState(
    draftVersion?.id ?? versions[0]?.id ?? ""
  );

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? draftVersion ?? versions[0];
  const graph = useMemo(
    () => (activeVersion ? parseGraph(activeVersion) : null),
    [activeVersion]
  );

  function handleNewDraftFromPublished() {
    const source = versions.find((v) => v.status === "PUBLISHED") ?? versions[0];
    if (!source) return;
    startTransition(async () => {
      try {
        const created = await createFlowVersionFromSourceAction(flowId, source.id);
        setActiveVersionId(created.id);
        toast.success("Nueva versión borrador creada");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al crear borrador");
      }
    });
  }

  if (!activeVersion || !graph) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay grafo para editar en esta versión.
      </p>
    );
  }

  if (activeVersion.status !== "DRAFT") {
    return (
      <div className="space-y-4 rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          La versión v{activeVersion.version_number} está publicada y no se puede editar
          directamente.
        </p>
        <Button disabled={pending} onClick={handleNewDraftFromPublished}>
          <FileEdit className="size-4" />
          {pending ? "Creando..." : "Crear borrador desde esta versión"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Versión:</label>
          <select
            className="h-9 rounded-md border px-2 text-sm"
            value={activeVersionId}
            onChange={(e) => setActiveVersionId(e.target.value)}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version_number} ({v.status})
              </option>
            ))}
          </select>
        </div>
      )}
      <FlowEditor
        key={activeVersion.id}
        flowId={flowId}
        versionId={activeVersion.id}
        initialGraph={graph}
      />
    </div>
  );
}
