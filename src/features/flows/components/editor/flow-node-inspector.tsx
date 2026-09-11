"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import type { FlowDefinitionGraph, FlowFieldDefinition, FlowNode } from "@/lib/flows/graph-types";
import { getFlowNodeLabel } from "@/lib/flows/graph-layout";
import { flowEditorTheme } from "./flow-editor-theme";
import { FlowInspectorSection } from "./flow-inspector-section";
import { FlowFieldPicker, FlowFieldSelect } from "./flow-field-picker";
import { FlowNodeTypeIcon } from "./flow-node-type-icon";

type FlowNodeInspectorProps = {
  graph: FlowDefinitionGraph;
  node: FlowNode | null;
  onGraphChange: (graph: FlowDefinitionGraph) => void;
  onNodeChange: (node: FlowNode) => void;
};

function updateNodeInGraph(graph: FlowDefinitionGraph, node: FlowNode): FlowDefinitionGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === node.id ? node : n)),
  };
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  number: "Número",
  date: "Fecha",
  option: "Opción",
  file: "Archivo / imagen",
};

function TriggerFields({
  graph,
  onGraphChange,
}: {
  graph: FlowDefinitionGraph;
  onGraphChange: (g: FlowDefinitionGraph) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Cuándo se activa el flujo</Label>
        <select
          className="h-9 w-full rounded-md border bg-white px-2 text-sm"
          value={graph.trigger.type}
          onChange={(e) =>
            onGraphChange({
              ...graph,
              trigger: { ...graph.trigger, type: e.target.value as FlowDefinitionGraph["trigger"]["type"] },
            })
          }
        >
          <option value="manual">Manual</option>
          <option value="ai_intent">Intención IA</option>
          <option value="keyword">Palabra clave</option>
          <option value="webhook">Webhook</option>
          <option value="api">API</option>
        </select>
      </div>
      {graph.trigger.type === "ai_intent" && (
        <div className="space-y-2">
          <Label>Intención (intent)</Label>
          <Input
            value={graph.trigger.intent ?? ""}
            placeholder="solicitar_cotizacion"
            onChange={(e) =>
              onGraphChange({ ...graph, trigger: { ...graph.trigger, intent: e.target.value } })
            }
          />
        </div>
      )}
      {graph.trigger.type === "keyword" && (
        <div className="space-y-2">
          <Label>Palabras clave (separadas por coma)</Label>
          <Input
            value={(graph.trigger.keywords ?? []).join(", ")}
            placeholder="cotizar, cotización, presupuesto"
            onChange={(e) =>
              onGraphChange({
                ...graph,
                trigger: {
                  ...graph.trigger,
                  keywords: e.target.value
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function GlobalFieldsEditor({
  graph,
  onGraphChange,
}: {
  graph: FlowDefinitionGraph;
  onGraphChange: (g: FlowDefinitionGraph) => void;
}) {
  function updateField(index: number, patch: Partial<FlowFieldDefinition>) {
    const fields = graph.fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onGraphChange({ ...graph, fields });
  }

  function addField() {
    onGraphChange({
      ...graph,
      fields: [
        ...graph.fields,
        { key: `campo_${Date.now()}`, label: "Nuevo campo", type: "text", required: false },
      ],
    });
  }

  function removeField(index: number) {
    onGraphChange({ ...graph, fields: graph.fields.filter((_, i) => i !== index) });
  }

  if (graph.fields.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs" style={{ color: flowEditorTheme.panelMuted }}>
          Define los datos que el flujo va a pedir (nombre, producto, logo, etc.).
        </p>
        <button
          type="button"
          className="w-full rounded-md border border-dashed px-3 py-2 text-xs font-medium hover:bg-white"
          style={{ borderColor: flowEditorTheme.panelBorder, color: flowEditorTheme.ink }}
          onClick={addField}
        >
          + Agregar primer campo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: flowEditorTheme.panelMuted }}>
          Datos que el bot puede capturar en el flujo.
        </p>
        <button
          type="button"
          className="text-xs font-medium text-[#7678ed] hover:underline"
          onClick={addField}
        >
          + Campo
        </button>
      </div>
      <div className="space-y-2">
        {graph.fields.map((field, index) => (
          <div
            key={`${field.key}-${index}`}
            className="space-y-2 rounded-lg border bg-[#FAFCFB] p-3"
            style={{ borderColor: flowEditorTheme.panelBorder }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium" style={{ color: flowEditorTheme.ink }}>
                {field.label?.trim() || "Campo sin nombre"}
              </p>
              <button
                type="button"
                className="rounded p-1 text-red-600 hover:bg-red-50"
                onClick={() => removeField(index)}
                title="Eliminar campo"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Clave técnica (key)</Label>
              <Input
                value={field.key}
                onChange={(e) => updateField(index, { key: e.target.value })}
                placeholder="customer.name"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Nombre visible</Label>
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Nombre del cliente"
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Tipo</Label>
                <select
                  className="h-8 w-full rounded-md border bg-white px-2 text-xs"
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value })}
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-end gap-2 pb-1 text-xs">
                <input
                  type="checkbox"
                  checked={field.required ?? false}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                />
                Obligatorio
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeTypeForm({
  node,
  flowFields,
  onNodeChange,
}: {
  node: FlowNode;
  flowFields: FlowFieldDefinition[];
  onNodeChange: (n: FlowNode) => void;
}) {
  function setConfig(key: string, value: unknown) {
    onNodeChange({ ...node, config: { ...node.config, [key]: value } });
  }

  const selectedCollectFields = Array.isArray(node.config.fields)
    ? (node.config.fields as string[])
    : [];
  const selectedSummaryFields = Array.isArray(node.config.summaryFields)
    ? (node.config.summaryFields as string[])
    : [];

  const messageText = String(node.config.template ?? node.config.text ?? "");
  const messageMissing = node.type === "message" && messageText.trim().length === 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Nombre del nodo</Label>
        <Input
          value={node.label ?? ""}
          onChange={(e) => onNodeChange({ ...node, label: e.target.value })}
          placeholder={getFlowNodeLabel(node.type)}
        />
      </div>

      {node.type === "message" && (
        <div className="space-y-2">
          <Label className={messageMissing ? "text-red-600" : undefined}>
            Texto del mensaje {messageMissing && <span className="text-red-600">*</span>}
          </Label>
          <Textarea
            value={messageText}
            onChange={(e) => setConfig("template", e.target.value)}
            rows={5}
            autoFocus
            placeholder="¡Hola! Para armar tu cotización necesito algunos datos..."
            className={messageMissing ? "border-red-300 focus-visible:ring-red-300" : undefined}
          />
          <p className="text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
            Este es el mensaje que verá el cliente en WhatsApp. Puedes usar variables como{" "}
            <code className="rounded bg-white px-1">{"{{customer.name}}"}</code>.
          </p>
        </div>
      )}

      {node.type === "collect_fields" && (
        <>
          <div className="space-y-2">
            <Label>Cómo capturar</Label>
            <select
              className="h-9 w-full rounded-md border bg-white px-2 text-sm"
              value={String(node.config.strategy ?? "ask_missing_only")}
              onChange={(e) => setConfig("strategy", e.target.value)}
            >
              <option value="ask_missing_only">Preguntar solo lo que falta</option>
              <option value="extract_from_context">Extraer del mensaje (IA)</option>
              <option value="await_file">Esperar archivo o imagen</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Campos a pedir</Label>
            <FlowFieldPicker
              fields={flowFields}
              selectedKeys={selectedCollectFields}
              onChange={(keys) => setConfig("fields", keys)}
            />
          </div>
          <div className="space-y-2">
            <Label>Instrucción para el bot (opcional)</Label>
            <Textarea
              value={String(node.config.prompt ?? "")}
              onChange={(e) => setConfig("prompt", e.target.value)}
              rows={3}
              placeholder="Pide el nombre y el producto de forma amable..."
            />
          </div>
        </>
      )}

      {node.type === "choice" && (
        <>
          <div className="space-y-2">
            <Label>Campo a guardar</Label>
            <FlowFieldSelect
              fields={flowFields}
              value={String(node.config.field ?? "")}
              onChange={(key) => setConfig("field", key)}
            />
          </div>
          <div className="space-y-2">
            <Label>Opciones (JSON)</Label>
            <Textarea
              value={JSON.stringify(node.config.options ?? [], null, 2)}
              onChange={(e) => {
                try {
                  setConfig("options", JSON.parse(e.target.value));
                } catch {
                  /* ignore while typing */
                }
              }}
              rows={5}
              className="font-mono text-xs"
            />
          </div>
        </>
      )}

      {node.type === "review" && (
        <>
          <div className="space-y-2">
            <Label>Campo a revisar</Label>
            <FlowFieldSelect
              fields={flowFields.filter((f) => f.type === "file")}
              value={String(node.config.subjectField ?? "")}
              onChange={(key) => setConfig("subjectField", key)}
              placeholder="Selecciona el archivo a revisar…"
            />
            {flowFields.filter((f) => f.type === "file").length === 0 && (
              <p className="text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
                Agrega un campo tipo «Archivo / imagen» en Campos del flujo (ej. logo).
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Intentos máximos</Label>
            <Input
              type="number"
              value={String(node.config.maxAttempts ?? 3)}
              onChange={(e) => setConfig("maxAttempts", Number(e.target.value))}
            />
          </div>
        </>
      )}

      {node.type === "action" && (
        <div className="space-y-2">
          <Label>Acción a ejecutar</Label>
          <Input
            value={String(node.config.action ?? "")}
            onChange={(e) => setConfig("action", e.target.value)}
            placeholder="calculate_quote"
          />
        </div>
      )}

      {node.type === "emit_event" && (
        <div className="space-y-2">
          <Label>Tipo de evento</Label>
          <Input
            value={String(node.config.eventType ?? "")}
            onChange={(e) => setConfig("eventType", e.target.value)}
            placeholder="quote.confirmed"
          />
        </div>
      )}

      {node.type === "handoff" && (
        <div className="space-y-2">
          <Label>Motivo de derivación</Label>
          <Input
            value={String(node.config.reason ?? "")}
            onChange={(e) => setConfig("reason", e.target.value)}
            placeholder="Cliente solicita hablar con humano"
          />
        </div>
      )}

      {node.type === "confirmation" && (
        <div className="space-y-2">
          <Label>Campos del resumen</Label>
          <FlowFieldPicker
            fields={flowFields}
            selectedKeys={selectedSummaryFields}
            onChange={(keys) => setConfig("summaryFields", keys)}
          />
        </div>
      )}

      {(node.type === "start" || node.type === "end" || node.type === "wait" || node.type === "condition") && (
        <p className="text-xs" style={{ color: flowEditorTheme.panelMuted }}>
          Este tipo de nodo no requiere más configuración en el editor.
        </p>
      )}

      <details className="text-xs" style={{ color: flowEditorTheme.panelMuted }}>
        <summary className="cursor-pointer hover:underline">ID técnico</summary>
        <p className="mt-1 font-mono break-all">{node.id}</p>
      </details>
    </div>
  );
}

export function FlowNodeInspector({
  graph,
  node,
  onGraphChange,
  onNodeChange,
}: FlowNodeInspectorProps) {
  const handleNodeUpdate = (updated: FlowNode) => {
    onNodeChange(updated);
    onGraphChange(updateNodeInGraph(graph, updated));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="shrink-0 border-b px-3 py-2"
        style={{ borderColor: flowEditorTheme.panelBorder, background: flowEditorTheme.panelAccent }}
      >
        <p className="text-sm font-semibold" style={{ color: flowEditorTheme.ink }}>
          Inspector
        </p>
        <p className="text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
          {node ? "Edita el nodo seleccionado abajo" : "Haz clic en un nodo del canvas"}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {node ? (
          <section
            className="rounded-lg border-2 bg-white p-3 shadow-sm"
            style={{ borderColor: flowEditorTheme.primary }}
          >
            <div className="mb-3 flex items-center gap-2">
              <FlowNodeTypeIcon type={node.type} size="sm" />
              <div>
                <p className="text-sm font-semibold" style={{ color: flowEditorTheme.ink }}>
                  {node.label ?? getFlowNodeLabel(node.type)}
                </p>
                <p className="text-[11px] capitalize" style={{ color: flowEditorTheme.panelMuted }}>
                  {getFlowNodeLabel(node.type)}
                </p>
              </div>
            </div>
            <NodeTypeForm node={node} flowFields={graph.fields} onNodeChange={handleNodeUpdate} />
          </section>
        ) : (
          <div
            className="rounded-lg border border-dashed px-3 py-4 text-center text-sm"
            style={{ borderColor: flowEditorTheme.panelBorder, color: flowEditorTheme.panelMuted }}
          >
            Selecciona un nodo en el canvas para editar su mensaje, campos o acción.
          </div>
        )}

        <FlowInspectorSection
          title="Campos del flujo"
          subtitle="Datos globales (nombre, producto, logo…)"
          badge={graph.fields.length}
          defaultOpen={!node && graph.fields.length > 0}
        >
          <GlobalFieldsEditor graph={graph} onGraphChange={onGraphChange} />
        </FlowInspectorSection>

        <FlowInspectorSection
          title="Disparador"
          subtitle="Cuándo inicia el flujo"
          defaultOpen={!node}
        >
          <TriggerFields graph={graph} onGraphChange={onGraphChange} />
        </FlowInspectorSection>
      </div>
    </div>
  );
}
