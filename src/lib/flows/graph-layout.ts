import type { Edge, Node } from "@xyflow/react";
import type { FlowDefinitionGraph, FlowEdge, FlowNode, FlowNodeType } from "@/lib/flows/graph-types";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

type UiPosition = { x: number; y: number };

function getNodePosition(node: FlowNode, index: number): UiPosition {
  const ui = node.config.ui as UiPosition | undefined;
  if (ui && typeof ui.x === "number" && typeof ui.y === "number") {
    return { x: ui.x, y: ui.y };
  }
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: col * (NODE_WIDTH + 48), y: row * (NODE_HEIGHT + 40) };
}

const NODE_LABELS: Record<FlowNodeType, string> = {
  start: "Inicio",
  message: "Mensaje",
  collect_fields: "Capturar datos",
  choice: "Elección",
  condition: "Condición",
  review: "Revisión",
  action: "Acción",
  wait: "Espera",
  handoff: "Derivar humano",
  confirmation: "Confirmación",
  emit_event: "Emitir evento",
  end: "Fin",
};

export function getFlowNodeLabel(type: FlowNodeType) {
  return NODE_LABELS[type] ?? type;
}

export function graphToFlowNodes(graph: FlowDefinitionGraph): Node[] {
  return graph.nodes.map((node, index) => {
    const position = getNodePosition(node, index);
    return {
      id: node.id,
      type: "flowNode",
      position,
      data: {
        flowType: node.type,
        label: node.label ?? getFlowNodeLabel(node.type as FlowNodeType),
      },
    };
  });
}

export function graphToFlowEdges(graph: FlowDefinitionGraph): Edge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.condition?.field ? `${edge.condition.field}` : undefined,
    animated: Boolean(edge.condition),
  }));
}

export function applyFlowPositionsToGraph(
  graph: FlowDefinitionGraph,
  nodes: Node[]
): FlowDefinitionGraph {
  const positionById = new Map(nodes.map((n) => [n.id, n.position]));
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const pos = positionById.get(node.id);
      if (!pos) return node;
      return {
        ...node,
        config: {
          ...node.config,
          ui: { x: pos.x, y: pos.y },
        },
      };
    }),
  };
}

export function createDefaultNode(type: FlowNodeType, id: string): FlowNode {
  const base = { id, type, label: getFlowNodeLabel(type), config: {} as Record<string, unknown> };

  switch (type) {
    case "message":
      return { ...base, config: { template: "", sender: "bot" } };
    case "collect_fields":
      return { ...base, config: { strategy: "ask_missing_only", fields: [] } };
    case "choice":
      return {
        ...base,
        config: {
          field: "",
          options: [
            { value: "opcion_a", label: "Opción A" },
            { value: "opcion_b", label: "Opción B" },
          ],
        },
      };
    case "review":
      return {
        ...base,
        config: {
          subjectField: "",
          reviewMode: "human",
          maxAttempts: 3,
        },
      };
    case "action":
      return { ...base, config: { action: "calculate_quote" } };
    case "emit_event":
      return { ...base, config: { eventType: "quote.confirmed" } };
    case "handoff":
      return { ...base, config: { reason: "manual_handoff" } };
    case "confirmation":
      return { ...base, config: { summaryFields: [] } };
    case "wait":
      return { ...base, config: { durationMinutes: 5 } };
    default:
      return base;
  }
}

export function duplicateNode(node: FlowNode): FlowNode {
  const suffix = Date.now().toString(36);
  const ui = node.config.ui as UiPosition | undefined;
  return {
    ...structuredClone(node),
    id: `${node.id}-copy-${suffix}`,
    label: `${node.label ?? node.id} (copia)`,
    config: {
      ...structuredClone(node.config),
      ui: ui ? { x: ui.x + 40, y: ui.y + 40 } : { x: 100, y: 100 },
    },
  };
}

export function newEdgeId(source: string, target: string) {
  return `e-${source}-${target}-${Date.now().toString(36)}`;
}

export function syncEdgesFromFlow(edges: Edge[]): FlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));
}

export function generateNodeId(type: FlowNodeType) {
  return `${type}-${Date.now().toString(36)}`;
}
