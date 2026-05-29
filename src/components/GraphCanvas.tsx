import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../store";
import { STATUS_COLOR, type Status } from "../types";

export function GraphCanvas() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const cards = useStore((s) => s.cards);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);

  const statusByElement = useMemo(() => {
    const m: Record<string, Status> = {};
    for (const c of cards) m[c.elementId] = c.status;
    return m;
  }, [cards]);

  const styledNodes = useMemo<Node[]>(
    () =>
      nodes.map((n) => {
        const color = STATUS_COLOR[statusByElement[n.id] ?? "todo"];
        return {
          ...n,
          style: {
            ...n.style,
            background: `${color}22`,
            border: `2px solid ${color}`,
            borderRadius: 8,
            color: "#111827",
            fontWeight: 600,
            padding: 8,
          },
        };
      }),
    [nodes, statusByElement],
  );

  const styledEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => {
        const status = statusByElement[e.id] ?? "todo";
        const color = STATUS_COLOR[status];
        return {
          ...e,
          animated: status === "in_progress",
          style: { ...e.style, stroke: color, strokeWidth: 2.5 },
          labelStyle: { fill: color, fontWeight: 600 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      }),
    [edges, statusByElement],
  );

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
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
