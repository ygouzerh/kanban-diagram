import { useState } from "react";
import { GraphCanvas } from "./components/GraphCanvas";
import { Kanban } from "./components/Kanban";
import { useStore } from "./store";

export default function App() {
  const addResource = useStore((s) => s.addResource);
  const loadExample = useStore((s) => s.loadExample);
  const reset = useStore((s) => s.reset);
  const hasData = useStore((s) => s.cards.length > 0);
  const [newResource, setNewResource] = useState("");

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar__title">Infra Kanban Map</span>
        <span className="hint">
          drag from a node's handle to link resources · move cards to change status
        </span>
        <div className="spacer" />
        <form
          className="add-resource"
          onSubmit={(e) => {
            e.preventDefault();
            const title = newResource.trim();
            if (!title) return;
            addResource(title);
            setNewResource("");
          }}
        >
          <input
            value={newResource}
            onChange={(e) => setNewResource(e.target.value)}
            placeholder="New resource name…"
            aria-label="New resource name"
          />
          <button type="submit" disabled={!newResource.trim()}>
            + Add
          </button>
        </form>
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
      <main className="panes">
        <section className="pane pane--kanban">
          <Kanban />
        </section>
        <section className="pane pane--graph">
          <GraphCanvas />
        </section>
      </main>
    </div>
  );
}
