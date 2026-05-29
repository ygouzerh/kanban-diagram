import { create } from "zustand";
import { persist } from "zustand/middleware";
import dagre from "@dagrejs/dagre";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import type { Card, Status } from "./types";

interface AppState {
  nodes: Node[];
  edges: Edge[];
  cards: Card[];
  // Transient: id of a freshly-created card to auto-edit inline (not persisted).
  pendingNameCardId: string | null;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;

  addResource: (title: string) => void;
  setCardStatus: (cardId: string, status: Status) => void;
  renameCard: (cardId: string, title: string) => void;
  setCardDescription: (cardId: string, description: string) => void;
  deleteCard: (cardId: string) => void;
  clearPendingName: () => void;

  autoLayout: () => void;
  loadExample: () => void;
  reset: () => void;
}

// Approx default node size, used when a node hasn't been measured yet.
const NODE_W = 170;
const NODE_H = 44;

const uid = () => crypto.randomUUID();

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      cards: [],
      pendingNameCardId: null,

      onNodesChange: (changes) => {
        const removed = changes
          .filter((c) => c.type === "remove")
          .map((c) => c.id);
        set((s) => ({
          nodes: applyNodeChanges(changes, s.nodes),
          cards: removed.length
            ? s.cards.filter(
                (c) => !(c.elementType === "node" && removed.includes(c.elementId)),
              )
            : s.cards,
        }));
      },

      onEdgesChange: (changes) => {
        const removed = changes
          .filter((c) => c.type === "remove")
          .map((c) => c.id);
        set((s) => ({
          edges: applyEdgeChanges(changes, s.edges),
          cards: removed.length
            ? s.cards.filter(
                (c) => !(c.elementType === "edge" && removed.includes(c.elementId)),
              )
            : s.cards,
        }));
      },

      onConnect: (conn) => {
        const title = "new link";
        const edgeId = uid();
        const cardId = uid();
        const edge: Edge = {
          id: edgeId,
          source: conn.source,
          target: conn.target,
          sourceHandle: conn.sourceHandle ?? undefined,
          targetHandle: conn.targetHandle ?? undefined,
          label: title,
          markerEnd: { type: MarkerType.ArrowClosed },
        };
        set((s) => ({
          edges: addEdge(edge, s.edges),
          cards: [
            ...s.cards,
            {
              id: cardId,
              title,
              status: "todo",
              elementId: edgeId,
              elementType: "edge",
            },
          ],
          // Trigger inline naming of the new link's card.
          pendingNameCardId: cardId,
        }));
      },

      addResource: (title) => {
        const nodeId = uid();
        const node: Node = {
          id: nodeId,
          position: {
            x: 120 + Math.random() * 280,
            y: 80 + Math.random() * 280,
          },
          data: { label: title },
        };
        set((s) => ({
          nodes: [...s.nodes, node],
          cards: [
            ...s.cards,
            {
              id: uid(),
              title,
              status: "todo",
              elementId: nodeId,
              elementType: "node",
            },
          ],
        }));
      },

      setCardStatus: (cardId, status) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === cardId ? { ...c, status } : c)),
        })),

      renameCard: (cardId, title) =>
        set((s) => {
          const card = s.cards.find((c) => c.id === cardId);
          if (!card) return {};
          return {
            cards: s.cards.map((c) => (c.id === cardId ? { ...c, title } : c)),
            nodes:
              card.elementType === "node"
                ? s.nodes.map((n) =>
                    n.id === card.elementId
                      ? { ...n, data: { ...n.data, label: title } }
                      : n,
                  )
                : s.nodes,
            edges:
              card.elementType === "edge"
                ? s.edges.map((e) =>
                    e.id === card.elementId ? { ...e, label: title } : e,
                  )
                : s.edges,
          };
        }),

      setCardDescription: (cardId, description) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, description } : c,
          ),
        })),

      deleteCard: (cardId) =>
        set((s) => {
          const card = s.cards.find((c) => c.id === cardId);
          if (!card) return {};
          return {
            cards: s.cards.filter((c) => c.id !== cardId),
            nodes:
              card.elementType === "node"
                ? s.nodes.filter((n) => n.id !== card.elementId)
                : s.nodes,
            edges:
              card.elementType === "edge"
                ? s.edges.filter((e) => e.id !== card.elementId)
                : // also drop edges dangling off a removed node
                  s.edges,
          };
        }),

      clearPendingName: () => set({ pendingNameCardId: null }),

      autoLayout: () =>
        set((s) => {
          const g = new dagre.graphlib.Graph();
          g.setGraph({ rankdir: "TB", nodesep: 70, ranksep: 90 });
          g.setDefaultEdgeLabel(() => ({}));
          for (const n of s.nodes) {
            g.setNode(n.id, {
              width: n.measured?.width ?? NODE_W,
              height: n.measured?.height ?? NODE_H,
            });
          }
          for (const e of s.edges) g.setEdge(e.source, e.target);
          dagre.layout(g);
          return {
            nodes: s.nodes.map((n) => {
              const p = g.node(n.id);
              // dagre returns center coords; React Flow uses top-left.
              return {
                ...n,
                position: { x: p.x - p.width / 2, y: p.y - p.height / 2 },
              };
            }),
          };
        }),

      loadExample: () => {
        const eks = uid();
        const app = uid();
        const rds = uid();
        const eksApp = uid();
        const netAccess = uid();
        set({
          nodes: [
            { id: eks, position: { x: 360, y: 60 }, data: { label: "EKS Cluster" } },
            { id: app, position: { x: 360, y: 280 }, data: { label: "Application" } },
            { id: rds, position: { x: 660, y: 60 }, data: { label: "RDS" } },
          ],
          edges: [
            {
              id: eksApp,
              source: app,
              target: eks,
              label: "runs on",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: netAccess,
              source: eks,
              target: rds,
              label: "network access",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
          ],
          cards: [
            { id: uid(), title: "EKS Cluster", status: "done", elementId: eks, elementType: "node", description: "Managed EKS 1.29 in ap-northeast-1, 3 managed node groups." },
            { id: uid(), title: "Application", status: "todo", elementId: app, elementType: "node", description: "Helm release, not yet deployed to the cluster." },
            { id: uid(), title: "RDS", status: "done", elementId: rds, elementType: "node", description: "Postgres 16, private subnets, encrypted at rest." },
            { id: uid(), title: "App runs on EKS", status: "todo", elementId: eksApp, elementType: "edge" },
            { id: uid(), title: "Network access", status: "in_progress", elementId: netAccess, elementType: "edge", description: "Security group rule allowing EKS pods to reach RDS on TCP 5432." },
          ],
        });
      },

      reset: () => set({ nodes: [], edges: [], cards: [] }),
    }),
    {
      name: "kanban-diagram",
      partialize: (s) => ({ nodes: s.nodes, edges: s.edges, cards: s.cards }),
    },
  ),
);
