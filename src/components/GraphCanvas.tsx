import { useMemo } from "react";
import {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../store";
import { STATUS_COLOR, type Card, type Status } from "../types";
import { StatusNode } from "./StatusNode";
import { FloatingEdge } from "./FloatingEdge";

// Stable references so React Flow doesn't warn / re-create on each render.
const nodeTypes: NodeTypes = { status: StatusNode };
const edgeTypes: EdgeTypes = { floating: FloatingEdge };

export function GraphCanvas() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const cards = useStore((s) => s.cards);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);

  const cardByElement = useMemo(() => {
    const m: Record<string, Card> = {};
    for (const c of cards) m[c.elementId] = c;
    return m;
  }, [cards]);

  const styledNodes = useMemo<Node[]>(
    () =>
      nodes.map((n) => {
        const card = cardByElement[n.id];
        return {
          ...n,
          type: "status",
          data: {
            ...n.data,
            status: card?.status ?? "todo",
            description: card?.description,
          },
        };
      }),
    [nodes, cardByElement],
  );

  const styledEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => {
        const status: Status = cardByElement[e.id]?.status ?? "todo";
        const color = STATUS_COLOR[status];
        return {
          ...e,
          type: "floating",
          animated: false, // solid lines, not dashed
          style: { ...e.style, stroke: color, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      }),
    [edges, cardByElement],
  );

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={ConnectionMode.Loose}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Panel position="top-right">
        <LayoutButton />
      </Panel>
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}

function LayoutButton() {
  const autoLayout = useStore((s) => s.autoLayout);
  const { fitView } = useReactFlow();
  return (
    <button
      className="organize-btn"
      onClick={() => {
        autoLayout();
        // wait for the new positions to render, then recenter
        setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
      }}
    >
      ⤢ Auto-organize
    </button>
  );
}
