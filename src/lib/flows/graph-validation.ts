import { flowDefinitionGraphSchema } from "@/lib/flows/graph-schema";
import type { FlowDefinitionGraph, FlowNode, FlowValidationIssue } from "@/lib/flows/graph-types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateNodeConfig(node: FlowNode): FlowValidationIssue[] {
  const issues: FlowValidationIssue[] = [];
  const base = `nodes.${node.id}`;

  switch (node.type) {
    case "message": {
      if (!isNonEmptyString(node.config.template) && !isNonEmptyString(node.config.text)) {
        issues.push({
          path: `${base}.config.template`,
          message: `Nodo "${node.label ?? node.id}": falta el texto o plantilla del mensaje`,
          severity: "error",
        });
      }
      break;
    }
    case "choice": {
      if (!isNonEmptyString(node.config.field)) {
        issues.push({
          path: `${base}.config.field`,
          message: `Nodo "${node.label ?? node.id}": indica el campo (field) de la opción`,
          severity: "error",
        });
      }
      const options = node.config.options;
      if (!Array.isArray(options) || options.length === 0) {
        issues.push({
          path: `${base}.config.options`,
          message: `Nodo "${node.label ?? node.id}": agrega al menos una opción`,
          severity: "error",
        });
      }
      break;
    }
    case "review": {
      if (!isNonEmptyString(node.config.subjectField)) {
        issues.push({
          path: `${base}.config.subjectField`,
          message: `Nodo "${node.label ?? node.id}": indica el campo a revisar (subjectField)`,
          severity: "error",
        });
      }
      break;
    }
    case "action": {
      if (!isNonEmptyString(node.config.action)) {
        issues.push({
          path: `${base}.config.action`,
          message: `Nodo "${node.label ?? node.id}": indica la acción a ejecutar`,
          severity: "error",
        });
      }
      break;
    }
    case "emit_event": {
      if (!isNonEmptyString(node.config.eventType)) {
        issues.push({
          path: `${base}.config.eventType`,
          message: `Nodo "${node.label ?? node.id}": indica el tipo de evento (eventType)`,
          severity: "error",
        });
      }
      break;
    }
    case "handoff": {
      if (!isNonEmptyString(node.config.reason)) {
        issues.push({
          path: `${base}.config.reason`,
          message: `Nodo "${node.label ?? node.id}": indica el motivo de derivación`,
          severity: "warning",
        });
      }
      break;
    }
    case "condition": {
      const hasOutgoing = true; // checked at graph level
      if (!node.config.expression && !hasOutgoing) {
        issues.push({
          path: base,
          message: `Nodo "${node.label ?? node.id}": condición sin configurar`,
          severity: "warning",
        });
      }
      break;
    }
    default:
      break;
  }

  return issues;
}

function validateGraphConnectivity(graph: FlowDefinitionGraph): FlowValidationIssue[] {
  const issues: FlowValidationIssue[] = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const reachable = new Set<string>();
  const start = graph.nodes.find((n) => n.type === "start");
  if (!start) return issues;

  const queue = [start.id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const edge of graph.edges.filter((e) => e.source === id)) {
      if (nodeIds.has(edge.target)) queue.push(edge.target);
    }
  }

  for (const node of graph.nodes) {
    if (!reachable.has(node.id) && node.type !== "start") {
      issues.push({
        path: `nodes.${node.id}`,
        message: `Nodo "${node.label ?? node.id}" no es alcanzable desde el inicio`,
        severity: "warning",
      });
    }
  }

  const endNodes = graph.nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    issues.push({
      path: "nodes",
      message: "El flujo debería tener al menos un nodo de fin (end)",
      severity: "warning",
    });
  }

  for (const node of graph.nodes) {
    if (node.type === "end") continue;
    const outgoing = graph.edges.filter((e) => e.source === node.id);
    if (outgoing.length === 0 && node.type !== "handoff") {
      issues.push({
        path: `nodes.${node.id}`,
        message: `Nodo "${node.label ?? node.id}" no tiene conexión de salida`,
        severity: "error",
      });
    }
  }

  return issues;
}

export function validateFlowGraph(graph: FlowDefinitionGraph): FlowValidationIssue[] {
  const issues: FlowValidationIssue[] = [];

  const parsed = flowDefinitionGraphSchema.safeParse(graph);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: issue.path.join("."),
        message: issue.message,
        severity: "error",
      });
    }
    return issues;
  }

  issues.push(...validateGraphConnectivity(graph));
  for (const node of graph.nodes) {
    issues.push(...validateNodeConfig(node));
  }

  if (graph.trigger.type === "keyword" && (!graph.trigger.keywords || graph.trigger.keywords.length === 0)) {
    issues.push({
      path: "trigger.keywords",
      message: "Trigger por palabra clave: agrega al menos una keyword",
      severity: "error",
    });
  }

  if (graph.trigger.type === "ai_intent" && !isNonEmptyString(graph.trigger.intent)) {
    issues.push({
      path: "trigger.intent",
      message: "Trigger por intención IA: indica el intent",
      severity: "error",
    });
  }

  return issues;
}

export function hasBlockingFlowErrors(issues: FlowValidationIssue[]) {
  return issues.some((i) => i.severity === "error");
}

export function getNodeIdFromValidationPath(path: string): string | null {
  const match = /^nodes\.([^.]+)/.exec(path);
  return match?.[1] ?? null;
}
