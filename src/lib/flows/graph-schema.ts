import { z } from "zod";

export const flowConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "in",
    "not_in",
    "exists",
    "not_exists",
  ]),
  value: z.unknown().optional(),
});

export const flowFieldDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  requiredWhen: flowConditionSchema.optional(),
  validation: z.record(z.string(), z.unknown()).optional(),
});

export const flowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: flowConditionSchema.optional(),
});

export const flowDefinitionGraphSchema = z
  .object({
    name: z.string().min(1).optional(),
    version: z.number().int().positive().optional(),
    trigger: z.object({
      type: z.enum(["manual", "ai_intent", "keyword", "webhook", "api"]),
      channel: z.enum(["whatsapp"]).optional(),
      keywords: z.array(z.string()).optional(),
      intent: z.string().optional(),
      priority: z.number().int().optional(),
    }),
    context: z.record(z.string(), z.unknown()).optional(),
    fields: z.array(flowFieldDefinitionSchema).default([]),
    nodes: z.array(flowNodeSchema).min(1),
    edges: z.array(flowEdgeSchema).default([]),
    outputSchemas: z
      .array(
        z.object({
          eventType: z.string().min(1),
          schemaVersion: z.string().default("1.0"),
        })
      )
      .default([]),
  })
  .superRefine((graph, ctx) => {
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    if (!graph.nodes.some((n) => n.type === "start")) {
      ctx.addIssue({
        code: "custom",
        message: "El grafo debe incluir un nodo de inicio (start)",
        path: ["nodes"],
      });
    }

    const duplicates = graph.nodes.map((n) => n.id).filter((id, i, arr) => arr.indexOf(id) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `IDs de nodo duplicados: ${[...new Set(duplicates)].join(", ")}`,
        path: ["nodes"],
      });
    }

    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: "custom",
          message: `Conexión con origen desconocido: ${edge.source}`,
          path: ["edges"],
        });
      }
      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: "custom",
          message: `Conexión con destino desconocido: ${edge.target}`,
          path: ["edges"],
        });
      }
    }
  });
