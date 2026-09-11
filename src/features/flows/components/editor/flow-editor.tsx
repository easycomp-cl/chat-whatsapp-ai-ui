"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./flow-editor.css";
import { toast } from "sonner";
import { Copy, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateFlowVersionAction } from "@/lib/actions/flow-actions";
import {
  FLOW_NODE_TYPES,
  type FlowDefinitionGraph,
  type FlowNodeType,
  type FlowValidationIssue,
} from "@/lib/flows/graph-types";
import {
  applyFlowPositionsToGraph,
  createDefaultNode,
  duplicateNode,
  generateNodeId,
  getFlowNodeLabel,
  graphToFlowEdges,
  graphToFlowNodes,
  newEdgeId,
  syncEdgesFromFlow,
} from "@/lib/flows/graph-layout";
import { hasBlockingFlowErrors, validateFlowGraph, getNodeIdFromValidationPath } from "@/lib/flows/graph-validation";
import { FlowCustomNode } from "@/features/flows/components/editor/flow-custom-node";
import { FlowNodeTypeIcon } from "@/features/flows/components/editor/flow-node-type-icon";
import { FlowNodeInspector } from "@/features/flows/components/editor/flow-node-inspector";
import { FlowValidationPanel } from "@/features/flows/components/editor/flow-validation-panel";
import {
  FLOW_EDITOR_DEFAULT_ZOOM,
  FLOW_EDITOR_GRID_MAJOR,
  FLOW_EDITOR_GRID_MINOR,
  FLOW_EDITOR_MAX_ZOOM,
  FLOW_EDITOR_MIN_ZOOM,
  flowEditorTheme,
  flowNodeTypeTheme,
} from "@/features/flows/components/editor/flow-editor-theme";

const nodeTypes = { flowNode: FlowCustomNode };

const FLOW_NODE_DRAG_MIME = "application/flow-node-type";

const defaultEdgeOptions = {
  style: { stroke: flowEditorTheme.edge, strokeWidth: 2.5 },
  animated: false,
};

type FlowEditorProps = {
  flowId: string;
  versionId: string;
  initialGraph: FlowDefinitionGraph;
  readOnly?: boolean;
};

export function FlowEditor({ flowId, versionId, initialGraph, readOnly }: FlowEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [graph, setGraph] = useState<FlowDefinitionGraph>(initialGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [issues, setIssues] = useState<FlowValidationIssue[]>(() => validateFlowGraph(initialGraph));

  const [nodes, setNodes, onNodesChange] = useNodesState(graphToFlowNodes(initialGraph));
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphToFlowEdges(initialGraph));
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph.nodes, selectedNodeId]
  );

  useEffect(() => {
    setIssues(validateFlowGraph(graph));
  }, [graph]);

  const rebuildCanvasFromGraph = useCallback(
    (nextGraph: FlowDefinitionGraph) => {
      setGraph(nextGraph);
      setNodes(graphToFlowNodes(nextGraph));
      setEdges(graphToFlowEdges(nextGraph));
    },
    [setNodes, setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
    void instance.fitView({ padding: 0.45, maxZoom: FLOW_EDITOR_DEFAULT_ZOOM });
    const { zoom, x, y } = instance.getViewport();
    if (zoom < FLOW_EDITOR_DEFAULT_ZOOM) {
      instance.setViewport({ x, y, zoom: FLOW_EDITOR_DEFAULT_ZOOM });
    }
  }, []);

  const addNodeAtPosition = useCallback(
    (type: FlowNodeType, position: { x: number; y: number }) => {
      if (type === "start" && graph.nodes.some((n) => n.type === "start")) {
        toast.error("Solo puede haber un nodo de inicio");
        return;
      }

      const id = generateNodeId(type);
      const flowNode = createDefaultNode(type, id);
      flowNode.config.ui = { x: position.x, y: position.y };

      const rfNode: Node = {
        id,
        type: "flowNode",
        position,
        data: {
          flowType: type,
          label: flowNode.label ?? getFlowNodeLabel(type),
        },
      };

      setGraph((g) => ({ ...g, nodes: [...g.nodes, flowNode] }));
      setNodes((nds) => [...nds, rfNode]);
      setSelectedNodeId(id);
    },
    [graph.nodes, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (readOnly) return;

      const type = event.dataTransfer.getData(FLOW_NODE_DRAG_MIME) as FlowNodeType;
      if (!type || !FLOW_NODE_TYPES.includes(type)) return;

      const instance = reactFlowInstanceRef.current;
      if (!instance) return;

      const position = instance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNodeAtPosition(type, {
        x: position.x - 88,
        y: position.y - 36,
      });
    },
    [addNodeAtPosition, readOnly]
  );

  function onPaletteDragStart(event: React.DragEvent, type: FlowNodeType) {
    event.dataTransfer.setData(FLOW_NODE_DRAG_MIME, type);
    event.dataTransfer.effectAllowed = "move";
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const edgeId = newEdgeId(connection.source, connection.target);
      const newFlowEdge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
      };
      setGraph((g) => ({ ...g, edges: [...g.edges, newFlowEdge] }));
      setEdges((eds) => addEdge({ ...connection, id: edgeId }, eds));
    },
    [setEdges]
  );

  function handleNodesDragStop() {
    setGraph((g) => applyFlowPositionsToGraph(g, nodes));
  }

  function handleDuplicateNode() {
    if (!selectedNode) return;
    if (selectedNode.type === "start") {
      toast.error("No se puede duplicar el nodo de inicio");
      return;
    }
    const copy = duplicateNode(selectedNode);
    const nextGraph = { ...graph, nodes: [...graph.nodes, copy] };
    rebuildCanvasFromGraph(nextGraph);
    setSelectedNodeId(copy.id);
    toast.success("Nodo duplicado — conéctalo desde el canvas");
  }

  function handleDeleteNode() {
    if (!selectedNode) return;
    if (selectedNode.type === "start") {
      toast.error("No se puede eliminar el nodo de inicio");
      return;
    }
    const nextGraph = {
      ...graph,
      nodes: graph.nodes.filter((n) => n.id !== selectedNode.id),
      edges: graph.edges.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      ),
    };
    rebuildCanvasFromGraph(nextGraph);
    setSelectedNodeId(null);
  }

  function handleSave() {
    const positioned = applyFlowPositionsToGraph(graph, nodes);
    const flowEdges = syncEdgesFromFlow(edges);
    const payload: FlowDefinitionGraph = { ...positioned, edges: flowEdges };
    const validation = validateFlowGraph(payload);
    setIssues(validation);

    startTransition(async () => {
      try {
        await updateFlowVersionAction(flowId, versionId, payload as unknown as Record<string, unknown>);
        setGraph(payload);
        if (hasBlockingFlowErrors(validation)) {
          toast.warning("Borrador guardado con errores — corrígelos antes de publicar");
        } else if (validation.some((v) => v.severity === "warning")) {
          toast.success("Borrador guardado (con advertencias)");
        } else {
          toast.success("Borrador guardado");
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al guardar");
      }
    });
  }

  function onEdgesDelete(deleted: Edge[]) {
    const ids = new Set(deleted.map((e) => e.id));
    setGraph((g) => ({ ...g, edges: g.edges.filter((e) => !ids.has(e.id)) }));
  }

  function onNodesDelete(deleted: Node[]) {
    const deletingStart = deleted.some((dn) => {
      const flowNode = graph.nodes.find((n) => n.id === dn.id);
      return flowNode?.type === "start";
    });
    if (deletingStart) {
      toast.error("No se puede eliminar el nodo de inicio");
      return;
    }
    const ids = new Set(deleted.map((n) => n.id));
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.filter((n) => !ids.has(n.id)),
      edges: g.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
    }));
  }

  async function onBeforeDelete({
    nodes: nodesToDelete,
  }: {
    nodes: Node[];
    edges: Edge[];
  }) {
    const deletingStart = nodesToDelete.some((dn) => {
      const flowNode = graph.nodes.find((n) => n.id === dn.id);
      return flowNode?.type === "start";
    });
    if (deletingStart) {
      toast.error("No se puede eliminar el nodo de inicio");
      return false;
    }
    return true;
  }

  function handleValidationIssueClick(issue: FlowValidationIssue) {
    const nodeId = getNodeIdFromValidationPath(issue.path);
    if (!nodeId) return;

    setSelectedNodeId(nodeId);
    const rfNode = nodes.find((n) => n.id === nodeId);
    const instance = reactFlowInstanceRef.current;
    if (rfNode && instance) {
      instance.setCenter(rfNode.position.x + 88, rfNode.position.y + 36, {
        zoom: FLOW_EDITOR_DEFAULT_ZOOM,
        duration: 280,
      });
    }
  }

  return (
    <div className="flex h-[min(720px,calc(100vh-220px))] min-h-[480px] flex-col gap-3">
      <FlowValidationPanel issues={issues} onIssueClick={handleValidationIssueClick} />

      <div
        className="flex min-h-0 flex-1 overflow-hidden rounded-xl border shadow-sm"
        style={{ borderColor: flowEditorTheme.panelBorder, background: flowEditorTheme.panel }}
      >
        <aside
          className="flex w-52 shrink-0 flex-col border-r p-3"
          style={{
            borderColor: flowEditorTheme.panelBorder,
            background: flowEditorTheme.panel,
          }}
        >
          <p
            className="mb-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide"
            style={{ background: flowEditorTheme.panelAccent, color: flowEditorTheme.ink }}
          >
            Añadir nodo
          </p>
          <p className="mb-2 px-1 text-[10px] leading-snug" style={{ color: flowEditorTheme.panelMuted }}>
            Arrastra al canvas
          </p>
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {FLOW_NODE_TYPES.filter((t) => t !== "start").map((type) => {
              const nodeTheme = flowNodeTypeTheme[type];
              return (
                <div
                  key={type}
                  draggable={!readOnly}
                  onDragStart={(event) => onPaletteDragStart(event, type)}
                  className="flow-editor-palette-item flex cursor-grab items-center gap-2 rounded-lg border bg-white px-2.5 py-2 text-left text-xs font-medium transition-colors active:cursor-grabbing hover:brightness-[0.98] disabled:opacity-50"
                  style={{
                    borderColor: nodeTheme?.border ?? flowEditorTheme.panelBorder,
                    color: flowEditorTheme.ink,
                  }}
                >
                  <FlowNodeTypeIcon type={type} size="sm" />
                  {getFlowNodeLabel(type)}
                </div>
              );
            })}
          </div>
          <div className="mt-auto flex flex-col gap-2 border-t pt-4" style={{ borderColor: flowEditorTheme.panelBorder }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selectedNode || readOnly}
              className="justify-start bg-white text-xs hover:brightness-[0.98]"
              style={{ borderColor: flowEditorTheme.panelBorder }}
              onClick={handleDuplicateNode}
            >
              <Copy className="size-3" />
              Duplicar nodo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selectedNode || readOnly}
              className="justify-start bg-white text-xs hover:brightness-[0.98]"
              style={{ borderColor: flowEditorTheme.panelBorder }}
              onClick={handleDeleteNode}
            >
              <Trash2 className="size-3" />
              Eliminar nodo
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || readOnly}
              className="justify-start text-xs text-white hover:opacity-90"
              style={{ backgroundColor: flowEditorTheme.primary }}
              onClick={handleSave}
            >
              <Save className="size-3" />
              {pending ? "Guardando..." : "Guardar borrador"}
            </Button>
          </div>
        </aside>

        <div className="flow-editor-canvas min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            onNodeDragStop={handleNodesDragStop}
            onEdgesDelete={readOnly ? undefined : onEdgesDelete}
            onNodesDelete={readOnly ? undefined : onNodesDelete}
            onBeforeDelete={readOnly ? undefined : onBeforeDelete}
            onInit={onInit}
            onDragOver={readOnly ? undefined : onDragOver}
            onDrop={readOnly ? undefined : onDrop}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            minZoom={FLOW_EDITOR_MIN_ZOOM}
            maxZoom={FLOW_EDITOR_MAX_ZOOM}
            defaultViewport={{ x: 0, y: 0, zoom: FLOW_EDITOR_DEFAULT_ZOOM }}
            deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
            style={{ background: flowEditorTheme.canvas }}
          >
            <Background
              variant={BackgroundVariant.Lines}
              gap={FLOW_EDITOR_GRID_MINOR}
              lineWidth={0.6}
              color={flowEditorTheme.canvasGridMinor}
            />
            <Background
              variant={BackgroundVariant.Lines}
              gap={FLOW_EDITOR_GRID_MAJOR}
              lineWidth={1.25}
              color={flowEditorTheme.canvasGridMajor}
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const type = (node.data as { flowType?: string })?.flowType;
                return flowNodeTypeTheme[type ?? ""]?.border ?? "#94A3B8";
              }}
              maskColor="rgb(26 69 67 / 0.75)"
            />
          </ReactFlow>
        </div>

        <aside
          className="flex w-80 shrink-0 flex-col border-l min-h-0"
          style={{
            borderColor: flowEditorTheme.panelBorder,
            background: flowEditorTheme.panel,
          }}
        >
          <FlowNodeInspector
            graph={graph}
            node={selectedNode}
            onGraphChange={setGraph}
            onNodeChange={(node) => {
              setGraph((g) => ({
                ...g,
                nodes: g.nodes.map((n) => (n.id === node.id ? node : n)),
              }));
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          label: node.label ?? getFlowNodeLabel(node.type as FlowNodeType),
                        },
                      }
                    : n
                )
              );
            }}
          />
        </aside>
      </div>
    </div>
  );
}
