# CLAUDE.md

Kanban Diagram — a single-user, client-only PoC (Vite + React 19 + TypeScript) where a kanban board's card statuses drive the colors of a live `@xyflow/react` diagram. No backend; state persists to `localStorage`.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (type-check then build)
npm run preview   # serve the production build
npm test          # Playwright e2e tests (headless; reuses/starts the dev server)
```

## Architecture

- **Single source of truth: `src/store.ts`** (zustand + `persist` middleware). It owns `nodes`, `edges`, and `cards`, plus all mutations (`addResource`, `setCardStatus`, `renameCard`, `setCardDescription`, `deleteCard`, `onConnect`, `autoLayout`, `loadExample`, `reset`). Both panes read from and derive off this store.
- **Cards are the link layer.** Each `Card` (`src/types.ts`) references exactly one diagram element via `elementId` + `elementType` (`"node" | "edge"`). Renaming/deleting a card propagates to its linked node/edge; removing a node/edge in the graph removes its card.
- **`src/App.tsx`** owns the two-pane layout: a draggable `.pane-gutter` (pointer-drag updates `splitPct`, clamped 20–80%) sets the panes' `grid-template-columns`, and a `view` state (`"both" | "kanban" | "map"`) hides either pane via the topbar toggle buttons (both can never be hidden). Layout state is React-only, not persisted.
- **`src/components/Kanban.tsx`** (left pane): columns by status, drag-and-drop to change status, inline title and description editors.
- **`src/components/GraphCanvas.tsx`** (right pane): joins `cards → elements` (via a `cardByElement` map) to assign each node/edge its `status`-derived color **and its `cardId`** (injected into `data`) before rendering. Custom node type `status` = `StatusNode`, custom edge type `floating` = `FloatingEdge`. Hosts two React Flow `Panel`s: Auto-organize (top-right) and the floating "+ Add resource" control (top-left, expands to an inline input → `addResource`).
- **`src/components/StatusNode.tsx`**: custom node with draw.io-style handles (4 sides × 3 points) that are **hidden until the node is hovered**. Shows the card description as a hover tooltip plus a minimalist note icon (`.status-node__note-icon`, top-right) when a description exists. Double-clicking the label edits the name inline (`renameCard(data.cardId, …)`).
- **`src/components/FloatingEdge.tsx` + `floating.ts`**: edges that attach to the nearest node boundary (geometry in `floating.ts`). Double-clicking the edge label edits it inline (`renameCard(data.cardId, …)`).

## Conventions & gotchas

- **Status → color** lives in `STATUS_COLOR` in `src/types.ts` (`STATUS_LABEL`/`STATUS_ORDER` alongside it). Change colors/labels there.
- **`type` is assigned in `GraphCanvas`, not the store.** Stored nodes/edges have no `type`; GraphCanvas sets `type: "status"` / `type: "floating"` (and color/style) when building `styledNodes`/`styledEdges`. Don't expect `type` on stored elements.
- **`connectionMode` is `Loose`** — every handle acts as both source and target, so any handle can connect to any handle.
- **In-map editing inputs need `nodrag nopan`** classes (and `stopPropagation` on mouse/dblclick) so React Flow doesn't hijack typing/dragging while inline-editing a node or edge label. The same applies to the floating add-resource panel.
- **`pendingNameCardId`** is a transient store field (excluded from persistence via `partialize`) used to auto-focus the inline title editor on a freshly drawn relationship's card.
- **Persistence:** `persist` with `name: "kanban-diagram"` and `partialize` persisting only `{ nodes, edges, cards }`.
