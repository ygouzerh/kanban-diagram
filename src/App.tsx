import { useCallback, useRef, useState } from "react";
import { GraphCanvas } from "./components/GraphCanvas";
import { Kanban } from "./components/Kanban";
import { useStore } from "./store";

type View = "both" | "kanban" | "map";

const SPLIT_MIN = 20;
const SPLIT_MAX = 80;
const SPLIT_DEFAULT = 40;

export default function App() {
  const loadExample = useStore((s) => s.loadExample);
  const reset = useStore((s) => s.reset);
  const hasData = useStore((s) => s.cards.length > 0);

  const [splitPct, setSplitPct] = useState(SPLIT_DEFAULT);
  const [view, setView] = useState<View>("both");

  const dragging = useRef(false);

  const onGutterPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const panes = document.querySelector(".panes") as HTMLElement;
        if (!panes) return;
        const { left, width } = panes.getBoundingClientRect();
        const pct = ((ev.clientX - left) / width) * 100;
        setSplitPct(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct)));
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    []
  );

  const showKanban = view === "both" || view === "kanban";
  const showMap = view === "both" || view === "map";

  // Toggle a pane: hide it if shown (the other stays), or restore both if hidden.
  const toggleKanban = () => setView(showKanban ? "map" : "both");
  const toggleMap = () => setView(showMap ? "kanban" : "both");

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar__title">Infra Kanban Map</span>
        <span className="hint">
          drag from a node's handle to link resources · move cards to change status
        </span>
        <div className="spacer" />
        {/* View toggles — at least one must remain visible */}
        <div className="view-toggles">
          <button
            className={showKanban ? "active" : ""}
            onClick={toggleKanban}
            title="Toggle kanban pane"
          >
            Kanban
          </button>
          <button
            className={showMap ? "active" : ""}
            onClick={toggleMap}
            title="Toggle map pane"
          >
            Map
          </button>
        </div>
        <button onClick={loadExample}>Load example</button>
        <button
          className="danger"
          onClick={() => {
            if (hasData && window.confirm("Clear the whole board?")) reset();
          }}
        >
          Reset
        </button>
      </header>
      <main
        className="panes"
        style={
          view === "both"
            ? { gridTemplateColumns: `${splitPct}% 4px 1fr` }
            : { gridTemplateColumns: "1fr" }
        }
      >
        {showKanban && (
          <section className="pane pane--kanban">
            <Kanban />
          </section>
        )}
        {view === "both" && (
          <div className="pane-gutter" onPointerDown={onGutterPointerDown} />
        )}
        {showMap && (
          <section className="pane pane--graph">
            <GraphCanvas />
          </section>
        )}
      </main>
    </div>
  );
}
