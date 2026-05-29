# Kanban Diagram

A single-page proof-of-concept for managing an infrastructure project as a kanban board whose statuses drive a live diagram. The board (left) and a React Flow graph (right) share one store: each card is linked to one diagram element (a resource node or a relationship edge), and the card's status sets that element's color. Move a card between columns and the node or edge recolors instantly. It's the same idea as a draw.io diagram, but the colors are derived from where the work sits on the board.

## Run

```bash
npm install
npm run dev      # Vite dev server
npm run build    # type-check (tsc -b) + production build
npm test         # Playwright end-to-end tests (headless)
```

It's a single-user PoC with no backend. State persists to your browser's `localStorage` (key `kanban-diagram`), so the board is per-browser and not shared.

## How it works

- **Cards link to elements.** Each kanban card maps to exactly one graph element: a node (a resource) or an edge (a relationship between resources).
- **Status drives color.** Columns are statuses — Not deployed (grey), In progress (blue), Deployed (green), Blocked (red). A card's status colors its linked node/edge. The board's top row holds the first three statuses; Blocked sits in its own row below.
- **Draw.io-style handles + floating edges.** Nodes expose connection points on all four sides; drag from one to create a relationship. Edges "float" — they attach to the nearest node boundary so they always route cleanly as nodes move.
- **Notes.** A card can carry a description, editable inline (Enter saves, Shift+Enter for a newline). Hover a card or a node to see it.
- **Auto-organize.** The canvas button runs a dagre layout to tidy the graph automatically.

Add resources from the toolbar, "Load example" to seed an EKS / App / RDS / IRSA scenario, or "Reset" to clear the board.
