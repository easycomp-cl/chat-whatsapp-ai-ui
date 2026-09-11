export const FLOW_NODE_TYPES = [
  "start",
  "message",
  "collect_fields",
  "choice",
  "condition",
  "review",
  "action",
  "wait",
  "handoff",
  "confirmation",
  "emit_event",
  "end",
] as const;

export type FlowNodeType = (typeof FLOW_NODE_TYPES)[number];

export type FlowCondition = {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in"
    | "exists"
    | "not_exists";
  value?: unknown;
};

export type FlowFieldDefinition = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  requiredWhen?: FlowCondition;
  validation?: Record<string, unknown>;
};

export type FlowNode = {
  id: string;
  type: FlowNodeType;
  label?: string;
  config: Record<string, unknown>;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  condition?: FlowCondition;
};

export type FlowDefinitionGraph = {
  name?: string;
  version?: number;
  trigger: {
    type: "manual" | "ai_intent" | "keyword" | "webhook" | "api";
    channel?: "whatsapp";
    keywords?: string[];
    intent?: string;
    priority?: number;
  };
  context?: {
    contextWindow?: {
      maxMessages?: number;
      maxAgeMinutes?: number;
      includeContactProfile?: boolean;
    };
  };
  fields: FlowFieldDefinition[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  outputSchemas: Array<{ eventType: string; schemaVersion: string }>;
};

export type FlowValidationIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};
