import { useRef, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { STATUS_COLOR, type Status } from "../types";
import { useStore } from "../store";

export interface StatusNodeData {
  label: string;
  status: Status;
  description?: string;
  cardId?: string;
  [key: string]: unknown;
}

// Handles on all 4 sides, multiple points per side (draw.io style).
// In loose connection mode each handle works as both source and target.
const SIDES: { position: Position; axis: "x" | "y" }[] = [
  { position: Position.Top, axis: "x" },
  { position: Position.Bottom, axis: "x" },
  { position: Position.Left, axis: "y" },
  { position: Position.Right, axis: "y" },
];
const OFFSETS = [25, 50, 75]; // percent along each side

export function StatusNode({ data }: NodeProps) {
  const d = data as StatusNodeData;
  const status = d.status ?? "todo";
  const color = STATUS_COLOR[status];
  const hasDesc = !!d.description?.trim();

  const renameCard = useStore((s) => s.renameCard);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(d.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when label changes externally (e.g. renamed from kanban)
  useEffect(() => {
    if (!editing) setDraft(d.label);
  }, [d.label, editing]);

  // Focus & select all on edit start
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    if (d.cardId) renameCard(d.cardId, draft || d.label);
    setEditing(false);
  };

  return (
    <div
      className="status-node"
      style={{ background: `${color}22`, borderColor: color }}
    >
      {SIDES.map(({ position, axis }) =>
        OFFSETS.map((off) => (
          <Handle
            key={`${position}-${off}`}
            id={`${position}-${off}`}
            type="source"
            position={position}
            className="node-handle"
            style={axis === "x" ? { left: `${off}%` } : { top: `${off}%` }}
          />
        )),
      )}

      {/* Minimalist note icon: shown when card has a description */}
      {hasDesc && (
        <svg
          className="status-node__note-icon"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1.5" y="1" width="9" height="10" rx="1.5" stroke="#6b7280" strokeWidth="1.2" />
          <line x1="3.5" y1="4" x2="8.5" y2="4" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
          <line x1="3.5" y1="6.5" x2="8.5" y2="6.5" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
          <line x1="3.5" y1="9" x2="6.5" y2="9" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}

      {editing ? (
        <input
          ref={inputRef}
          className="nodrag nopan status-node__label-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitRename(); }
            if (e.key === "Escape") { e.preventDefault(); setDraft(d.label); setEditing(false); }
          }}
          onBlur={commitRename}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="status-node__label"
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(d.label); }}
          title="Double-click to rename"
        >
          {d.label}
        </span>
      )}

      {hasDesc && (
        <div className="status-node__tip" role="tooltip">
          {d.description}
        </div>
      )}
    </div>
  );
}
