import { useState, type DragEvent } from "react";
import { useStore } from "../store";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_ORDER,
  type Card,
  type Status,
} from "../types";

export function Kanban() {
  const cards = useStore((s) => s.cards);
  const setCardStatus = useStore((s) => s.setCardStatus);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  const onDrop = (e: DragEvent, status: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) setCardStatus(id, status);
    setDragOver(null);
  };

  return (
    <div className="kanban">
      {STATUS_ORDER.map((status) => {
        const column = cards.filter((c) => c.status === status);
        return (
          <div
            key={status}
            className={`column${dragOver === status ? " column--over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={(e) => onDrop(e, status)}
          >
            <div className="column__head">
              <span
                className="dot"
                style={{ background: STATUS_COLOR[status] }}
              />
              {STATUS_LABEL[status]}
              <span className="count">{column.length}</span>
            </div>
            <div className="column__body">
              {column.map((card) => (
                <KanbanCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ card }: { card: Card }) {
  const renameCard = useStore((s) => s.renameCard);
  const deleteCard = useStore((s) => s.deleteCard);
  const setCardDescription = useStore((s) => s.setCardDescription);
  const [editing, setEditing] = useState(false);

  const hasDesc = !!card.description?.trim();

  return (
    <div
      className="card"
      draggable={!editing}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
      style={{ borderLeft: `4px solid ${STATUS_COLOR[card.status]}` }}
    >
      <div className="card__row">
        <span className={`tag tag--${card.elementType}`}>
          {card.elementType === "node" ? "resource" : "link"}
        </span>
        <span
          className="card__title"
          onDoubleClick={() => {
            const next = window.prompt("Rename", card.title)?.trim();
            if (next) renameCard(card.id, next);
          }}
          title="Double-click to rename"
        >
          {card.title}
        </span>
        <button
          className={`card__note${hasDesc ? " card__note--active" : ""}`}
          title={
            editing
              ? "Close description"
              : hasDesc
                ? "Edit description"
                : "Add description"
          }
          onClick={() => setEditing((v) => !v)}
        >
          note
        </button>
        <button
          className="card__del"
          title="Delete"
          onClick={() => deleteCard(card.id)}
        >
          ×
        </button>
      </div>

      {editing && (
        <textarea
          className="card__desc-edit"
          autoFocus
          placeholder="Add a description…"
          value={card.description ?? ""}
          onChange={(e) => setCardDescription(card.id, e.target.value)}
          onBlur={() => setEditing(false)}
        />
      )}

      {!editing && hasDesc && (
        <div className="card__tooltip" role="tooltip">
          {card.description}
        </div>
      )}
    </div>
  );
}
