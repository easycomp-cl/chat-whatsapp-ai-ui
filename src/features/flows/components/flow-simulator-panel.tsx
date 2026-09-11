"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ImageIcon, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FlowVersion } from "@/lib/bot-api/types";
import type { FlowDefinitionGraph } from "@/lib/flows/graph-types";
import {
  createInitialLocalSimState,
  getFieldLabels,
  parseGraphFromVersion,
  runLocalSimulationStep,
  type LocalSimState,
} from "@/lib/flows/flow-local-simulator";
import { FlowStepWheel } from "@/features/flows/components/editor/flow-step-wheel";
import { cn } from "@/lib/utils";
import { flowEditorTheme } from "@/features/flows/components/editor/flow-editor-theme";

type ChatMessage = {
  id: string;
  role: "customer" | "bot" | "system";
  content: string;
};

function parseGraph(version: FlowVersion | undefined): FlowDefinitionGraph | null {
  return parseGraphFromVersion(version?.graph_json);
}

export function FlowSimulatorPanel({
  versions,
}: {
  flowId: string;
  versions: FlowVersion[];
}) {
  const draftVersion = versions.find((v) => v.status === "DRAFT") ?? versions[0];
  const [versionId, setVersionId] = useState(draftVersion?.id ?? "");
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [simState, setSimState] = useState<LocalSimState | null>(null);
  const [manualDraft, setManualDraft] = useState<Record<string, string>>({});
  const [showTechnical, setShowTechnical] = useState(false);

  const activeVersion = versions.find((v) => v.id === versionId) ?? draftVersion;
  const graph = useMemo(() => parseGraph(activeVersion), [activeVersion]);

  useEffect(() => {
    if (graph) {
      setSimState(createInitialLocalSimState(graph));
      setThread([]);
      setDraft("");
      setManualDraft({});
    }
  }, [graph, versionId]);

  const capturedEntries = Object.entries(simState?.capturedFields ?? {});
  const awaitingFields = simState?.awaitingFieldKeys ?? [];
  const isWaiting = simState?.status === "awaiting_customer" || simState?.status === "awaiting_file";
  const isCompleted = simState?.status === "completed";
  const showStepForm = isWaiting && awaitingFields.length > 0;

  function pushBotMessages(messages: string[]) {
    if (messages.length === 0) return;
    setThread((prev) => [
      ...prev,
      ...messages.map((content, index) => ({
        id: `b-${Date.now()}-${index}`,
        role: "bot" as const,
        content,
      })),
    ]);
  }

  function applyStep(input: Parameters<typeof runLocalSimulationStep>[2] = {}) {
    if (!graph || !simState) return;
    const step = runLocalSimulationStep(graph, simState, input);
    setSimState(step.state);
    pushBotMessages(step.botMessages);
    setManualDraft({});
  }

  function resetConversation() {
    if (graph) {
      setSimState(createInitialLocalSimState(graph));
    }
    setThread([]);
    setDraft("");
    setManualDraft({});
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !graph || !simState || isCompleted) return;

    setThread((prev) => [...prev, { id: `c-${Date.now()}`, role: "customer", content: text }]);
    setDraft("");

    if (simState.status === "idle") {
      const step = runLocalSimulationStep(graph, simState, { customerMessage: text });
      setSimState(step.state);
      pushBotMessages(step.botMessages);
      return;
    }

    applyStep({ customerMessage: text });
  }

  function handleManualSubmit() {
    if (!isWaiting || awaitingFields.length === 0) return;
    const manualFields: Record<string, unknown> = {};
    for (const key of awaitingFields) {
      const value = manualDraft[key]?.trim();
      if (value) manualFields[key] = value;
    }
    if (Object.keys(manualFields).length === 0) return;
    applyStep({ manualFields });
  }

  function handleSimulateFile() {
    applyStep({ simulateFile: true });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  if (!graph) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay grafo en esta versión. Guarda el borrador en el editor primero.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border px-4 py-3 text-sm"
        style={{ borderColor: flowEditorTheme.panelBorder, background: flowEditorTheme.panelAccent }}
      >
        <p className="font-medium" style={{ color: flowEditorTheme.ink }}>
          Simulador paso a paso (local)
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: flowEditorTheme.panelMuted }}>
          Recorre <strong>cada nodo</strong> de tu grafo en orden: mensaje → capturar datos →
          siguiente nodo. Si el chat no entiende tu texto, usa el formulario del paso actual a la
          derecha. En WhatsApp real la IA del backend captura los datos automáticamente.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-h-[440px] flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
            style={{ borderColor: flowEditorTheme.panelBorder, background: flowEditorTheme.panel }}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {versions.length > 1 && (
                <select
                  className="h-8 rounded-md border bg-white px-2"
                  value={versionId}
                  onChange={(e) => setVersionId(e.target.value)}
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.version_number} ({version.status})
                    </option>
                  ))}
                </select>
              )}
              {isCompleted && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                  Completado
                </span>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={resetConversation}>
              <RotateCcw className="size-3.5" />
              Reiniciar
            </Button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-[#e5ddd5] p-4">
            {thread.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Envía un mensaje para iniciar el flujo (ej. «Hola, quiero cotizar»).
              </p>
            ) : (
              thread.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "customer" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm whitespace-pre-wrap",
                      msg.role === "customer"
                        ? "rounded-br-none bg-[#dcf8c6] text-[#111]"
                        : "rounded-bl-none bg-white text-[#111]"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t bg-[#f0f2f5] p-3">
            <div className="flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  isCompleted
                    ? "Flujo terminado — reinicia para probar de nuevo"
                    : "Escribe como cliente… (Enter para enviar)"
                }
                rows={2}
                disabled={isCompleted}
                className="min-h-[44px] resize-none bg-white"
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={isCompleted || !draft.trim()}
                className="shrink-0 self-end"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="w-full space-y-3 lg:w-80 lg:shrink-0">
          {simState && (
            <FlowStepWheel graph={graph} currentNodeId={simState.currentNodeId} />
          )}

          {showStepForm && (
            <div
              className="rounded-xl border-2 bg-white p-3 shadow-sm"
              style={{ borderColor: flowEditorTheme.primary }}
            >
              <p className="mb-1 text-sm font-semibold" style={{ color: flowEditorTheme.ink }}>
                Completar este paso
              </p>
              <p className="mb-3 text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
                {simState?.status === "awaiting_file"
                  ? "Este paso espera un archivo. Puedes simularlo o escribir un nombre de archivo."
                  : "Si el chat no capturó tus datos, complétalos aquí y confirma."}
              </p>
              <div className="space-y-2">
                {getFieldLabels(graph, awaitingFields).map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      value={manualDraft[field.key] ?? ""}
                      onChange={(e) =>
                        setManualDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={
                        field.type === "file" ? "logo.png" : `Valor para ${field.label}`
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Button type="button" size="sm" onClick={handleManualSubmit}>
                  Confirmar datos del paso
                </Button>
                {simState?.status === "awaiting_file" && (
                  <Button type="button" size="sm" variant="outline" onClick={handleSimulateFile}>
                    <ImageIcon className="size-3.5" />
                    Simular envío de imagen
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <p className="mb-2 text-sm font-semibold">Datos capturados (total)</p>
            {capturedEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aún no hay datos guardados.</p>
            ) : (
              <ul className="space-y-1.5">
                {capturedEntries.map(([key, value]) => {
                  const label = graph.fields.find((f) => f.key === key)?.label ?? key;
                  return (
                    <li
                      key={key}
                      className="rounded-md px-2 py-1.5 text-xs"
                      style={{ background: flowEditorTheme.panelAccent }}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="block truncate text-muted-foreground">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
              onClick={() => setShowTechnical((v) => !v)}
            >
              Recorrido del grafo
              <ChevronDown
                className={cn("size-4 transition-transform", showTechnical && "rotate-180")}
              />
            </button>
            {showTechnical && (
              <ul className="max-h-40 space-y-0.5 overflow-y-auto border-t px-3 py-2 text-[11px] text-muted-foreground">
                {(simState?.logs ?? []).map((log, i) => (
                  <li key={i}>{log}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
