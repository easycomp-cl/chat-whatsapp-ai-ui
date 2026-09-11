import type { FlowDefinitionGraph, FlowFieldDefinition, FlowNode } from "@/lib/flows/graph-types";
import { getFlowNodeLabel } from "@/lib/flows/graph-layout";

export type LocalSimStatus =
  | "idle"
  | "awaiting_customer"
  | "awaiting_file"
  | "completed"
  | "stopped";

export type LocalSimState = {
  currentNodeId: string | null;
  capturedFields: Record<string, unknown>;
  logs: string[];
  status: LocalSimStatus;
  awaitingFieldKeys: string[];
  visitedNodeIds: string[];
};

export type LocalSimInput = {
  customerMessage?: string;
  manualFields?: Record<string, unknown>;
  simulateFile?: boolean;
};

export type LocalSimStep = {
  botMessages: string[];
  state: LocalSimState;
  currentNode: FlowNode | null;
};

export function parseGraphFromVersion(graphJson: unknown): FlowDefinitionGraph | null {
  if (!graphJson || typeof graphJson !== "object") return null;
  return graphJson as FlowDefinitionGraph;
}

export function createInitialLocalSimState(graph: FlowDefinitionGraph): LocalSimState {
  const start = graph.nodes.find((n) => n.type === "start");
  return {
    currentNodeId: start?.id ?? null,
    capturedFields: {},
    logs: [],
    status: "idle",
    awaitingFieldKeys: [],
    visitedNodeIds: [],
  };
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function getFieldDef(graph: FlowDefinitionGraph, key: string) {
  return graph.fields.find((f) => f.key === key);
}

function getNode(graph: FlowDefinitionGraph, id: string | null) {
  if (!id) return null;
  return graph.nodes.find((n) => n.id === id) ?? null;
}

function getOutgoingEdges(graph: FlowDefinitionGraph, nodeId: string) {
  return graph.edges.filter((e) => e.source === nodeId);
}

function getDefaultNextNodeId(graph: FlowDefinitionGraph, nodeId: string) {
  return getOutgoingEdges(graph, nodeId)[0]?.target ?? null;
}

function renderTemplate(template: string, fields: Record<string, unknown>) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    const value = fields[key];
    return value === undefined || value === null ? `{{${key}}}` : String(value);
  });
}

function buildCollectPrompt(
  graph: FlowDefinitionGraph,
  node: FlowNode,
  missingKeys: string[]
) {
  const custom = String(node.config.prompt ?? "").trim();
  if (custom) return custom;

  const labels = missingKeys.map((key) => getFieldDef(graph, key)?.label ?? key);
  if (labels.length === 1) {
    return `Por favor indícame: ${labels[0]}.`;
  }
  return `Necesito algunos datos más: ${labels.join(", ")}.`;
}

function splitCustomerParts(message: string) {
  return message
    .split(/\s*,\s*|\s+y\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function tryCaptureFromMessage(
  message: string,
  fieldKeys: string[],
  graph: FlowDefinitionGraph
) {
  const captured: Record<string, unknown> = {};
  const text = message.trim();
  if (!text) return captured;

  if (fieldKeys.length === 1) {
    captured[fieldKeys[0]] = text;
    return captured;
  }

  const parts = splitCustomerParts(text);
  if (parts.length === fieldKeys.length) {
    fieldKeys.forEach((key, index) => {
      captured[key] = parts[index];
    });
    return captured;
  }

  for (const key of fieldKeys) {
    const def = getFieldDef(graph, key);
    const label = (def?.label ?? key).toLowerCase();
    if (text.toLowerCase().includes(label)) {
      const regex = new RegExp(`${label}\\s*:?\\s*([^,;]+)`, "i");
      const match = text.match(regex);
      if (match?.[1]) captured[key] = match[1].trim();
    }
  }

  if (Object.keys(captured).length === 0 && parts.length > 0) {
    fieldKeys.forEach((key, index) => {
      if (parts[index]) captured[key] = parts[index];
    });
  }

  return captured;
}

function appendLog(state: LocalSimState, message: string) {
  state.logs.push(message);
}

function visitNode(state: LocalSimState, node: FlowNode) {
  if (!state.visitedNodeIds.includes(node.id)) {
    state.visitedNodeIds.push(node.id);
  }
  appendLog(state, `Paso: ${node.label ?? getFlowNodeLabel(node.type)} (${node.type})`);
}

export function runLocalSimulationStep(
  graph: FlowDefinitionGraph,
  state: LocalSimState,
  input: LocalSimInput = {}
): LocalSimStep {
  const botMessages: string[] = [];
  const nextState: LocalSimState = {
    ...state,
    logs: [...state.logs],
    awaitingFieldKeys: [],
    status: "awaiting_customer",
  };

  let nodeId = state.currentNodeId;

  if (!nodeId) {
    nextState.status = "stopped";
    appendLog(nextState, "El grafo no tiene nodo de inicio.");
    return { botMessages, state: nextState, currentNode: null };
  }

  if (state.status === "awaiting_customer" || state.status === "awaiting_file") {
    const waitingNode = getNode(graph, nodeId);
    if (!waitingNode || waitingNode.type !== "collect_fields") {
      nextState.status = "stopped";
      return { botMessages, state: nextState, currentNode: waitingNode };
    }

    const fieldKeys = Array.isArray(waitingNode.config.fields)
      ? (waitingNode.config.fields as string[])
      : [];
    const strategy = String(waitingNode.config.strategy ?? "ask_missing_only");

    if (input.manualFields) {
      Object.assign(nextState.capturedFields, input.manualFields);
    }

    if (input.simulateFile) {
      const fileKey = fieldKeys.find((key) => getFieldDef(graph, key)?.type === "file") ?? fieldKeys[0];
      if (fileKey) {
        nextState.capturedFields[fileKey] = "[archivo-simulado.png]";
      }
    } else if (input.customerMessage) {
      const captured = tryCaptureFromMessage(input.customerMessage, fieldKeys, graph);
      Object.assign(nextState.capturedFields, captured);
    }

    const stillMissing = fieldKeys.filter((key) => !hasValue(nextState.capturedFields[key]));
    if (stillMissing.length > 0) {
      nextState.awaitingFieldKeys = stillMissing;
      nextState.status = strategy === "await_file" ? "awaiting_file" : "awaiting_customer";
      botMessages.push(buildCollectPrompt(graph, waitingNode, stillMissing));
      return { botMessages, state: nextState, currentNode: waitingNode };
    }

    nodeId = getDefaultNextNodeId(graph, waitingNode.id);
    nextState.currentNodeId = nodeId;
  }

  while (nodeId) {
    const node = getNode(graph, nodeId);
    if (!node) {
      nextState.status = "stopped";
      appendLog(nextState, `Nodo no encontrado: ${nodeId}`);
      break;
    }

    visitNode(nextState, node);

    switch (node.type) {
      case "start": {
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }

      case "message": {
        const template = String(node.config.template ?? node.config.text ?? "").trim();
        if (template) {
          botMessages.push(renderTemplate(template, nextState.capturedFields));
        }
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }

      case "collect_fields": {
        const fieldKeys = Array.isArray(node.config.fields)
          ? (node.config.fields as string[])
          : [];
        const strategy = String(node.config.strategy ?? "ask_missing_only");

        if (input.manualFields) {
          Object.assign(nextState.capturedFields, input.manualFields);
        }
        if (input.simulateFile) {
          const fileKey =
            fieldKeys.find((key) => getFieldDef(graph, key)?.type === "file") ?? fieldKeys[0];
          if (fileKey) nextState.capturedFields[fileKey] = "[archivo-simulado.png]";
        } else if (input.customerMessage) {
          const captured = tryCaptureFromMessage(input.customerMessage, fieldKeys, graph);
          Object.assign(nextState.capturedFields, captured);
        }

        const missing = fieldKeys.filter((key) => !hasValue(nextState.capturedFields[key]));

        if (missing.length === 0) {
          nodeId = getDefaultNextNodeId(graph, node.id);
          nextState.currentNodeId = nodeId;
          continue;
        }

        nextState.currentNodeId = node.id;
        nextState.awaitingFieldKeys = missing;
        nextState.status = strategy === "await_file" ? "awaiting_file" : "awaiting_customer";
        botMessages.push(buildCollectPrompt(graph, node, missing));
        return { botMessages, state: nextState, currentNode: node };
      }

      case "action": {
        const action = String(node.config.action ?? "acción");
        appendLog(nextState, `Acción ejecutada: ${action}`);
        botMessages.push(`[Acción: ${action}]`);
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }

      case "confirmation": {
        botMessages.push("¿Confirmas que los datos son correctos? (simulado)");
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }

      case "review": {
        botMessages.push("Enviado a revisión humana (simulado).");
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }

      case "handoff": {
        botMessages.push("Conversación derivada a un agente humano (simulado).");
        nextState.status = "completed";
        nextState.currentNodeId = node.id;
        return { botMessages, state: nextState, currentNode: node };
      }

      case "emit_event": {
        const eventType = String(node.config.eventType ?? "evento");
        appendLog(nextState, `Evento emitido: ${eventType}`);
        botMessages.push(`[Evento: ${eventType}]`);
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }

      case "end": {
        botMessages.push("Flujo completado.");
        nextState.status = "completed";
        nextState.currentNodeId = node.id;
        return { botMessages, state: nextState, currentNode: node };
      }

      default: {
        nodeId = getDefaultNextNodeId(graph, node.id);
        nextState.currentNodeId = nodeId;
        continue;
      }
    }
  }

  nextState.status = "completed";
  return { botMessages, state: nextState, currentNode: null };
}

export function getFieldLabels(
  graph: FlowDefinitionGraph,
  keys: string[]
): FlowFieldDefinition[] {
  return keys.map((key) => getFieldDef(graph, key) ?? { key, label: key, type: "text" });
}

/** Recorrido lineal del grafo (primer edge saliente en cada nodo). */
export function getLinearNodePath(graph: FlowDefinitionGraph): FlowNode[] {
  const path: FlowNode[] = [];
  const start = graph.nodes.find((n) => n.type === "start");
  if (!start) return path;

  const visited = new Set<string>();
  let currentId: string | null = start.id;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = graph.nodes.find((n) => n.id === currentId);
    if (!node) break;
    path.push(node);
    if (node.type === "end") break;
    currentId = getDefaultNextNodeId(graph, node.id);
  }

  return path;
}
