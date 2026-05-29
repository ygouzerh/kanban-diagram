import { useEffect, useRef, useState, type DragEvent } from "react";
import { useStore } from "../store";
import { STATUS_COLOR, STATUS_LABEL, type Card, type Status } from "../types";

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

  const renderColumn = (status: Status) => {
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
          <span className="dot" style={{ background: STATUS_COLOR[status] }} />
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
  };

  return (
    <div className="kanban">
      <div className="kanban__row kanban__row--main">
        {(["todo", "in_progress", "done"] as Status[]).map(renderColumn)}
      </div>
      <div className="kanban__row kanban__row--blocked">
        {renderColumn("blocked")}
      </div>
    </div>
  );
}

function KanbanCard({ card }: { card: Card }) {
  const renameCard = useStore((s) => s.renameCard);
  const deleteCard = useStore((s) => s.deleteCard);
  const setCardDescription = useStore((s) => s.setCardDescription);
  const pendingNameCardId = useStore((s) => s.pendingNameCardId);
  const clearPendingName = useStore((s) => s.clearPendingName);
  const [editing, setEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const hasDesc = !!card.description?.trim();

  // Auto-edit & select the title once when this card is freshly created.
  useEffect(() => {
    if (card.id === pendingNameCardId) {
      setEditingTitle(true);
      clearPendingName();
    }
  }, [card.id, pendingNameCardId, clearPendingName]);

  // Focus & select the title input whenever inline title editing starts.
  useEffect(() => {
    if (editingTitle) titleRef.current?.select();
  }, [editingTitle]);

  return (
    <div
      className="card"
      draggable={!editing && !editingTitle}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
      style={{ borderLeft: `4px solid ${STATUS_COLOR[card.status]}` }}
    >
      <div className="card__row">
        <span className={`tag tag--${card.elementType}`}>
          {card.elementType === "node" ? "resource" : "link"}
        </span>
        {editingTitle ? (
          <input
            ref={titleRef}
            className="card__title-edit"
            value={card.title}
            onChange={(e) => renameCard(card.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                setEditingTitle(false);
              }
            }}
            onBlur={() => setEditingTitle(false)}
          />
        ) : (
          <span
            className="card__title"
            onDoubleClick={() => setEditingTitle(true)}
            title="Double-click to rename"
          >
            {card.title}
          </span>
        )}
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
        <div className="card__desc">
          <textarea
            className="card__desc-edit"
            autoFocus
            placeholder="Add a description…"
            value={card.description ?? ""}
            onChange={(e) => setCardDescription(card.id, e.target.value)}
            onKeyDown={(e) => {
              // Enter saves & closes; Shift+Enter inserts a newline.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setEditing(false);
              }
            }}
            onBlur={() => setEditing(false)}
          />
          <div className="card__desc-actions">
            <span className="card__desc-hint">
              Enter to save · Shift+Enter for newline
            </span>
            {hasDesc && (
              <button
                className="card__desc-remove"
                // onMouseDown so we act before the textarea's onBlur fires
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCardDescription(card.id, "");
                  setEditing(false);
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {!editing && hasDesc && (
        <div className="card__tooltip" role="tooltip">
          {card.description}
        </div>
      )}
    </div>
  );
}
