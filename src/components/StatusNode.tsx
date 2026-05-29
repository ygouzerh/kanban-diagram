import { Handle, Position, type NodeProps } from "@xyflow/react";
import { STATUS_COLOR, type Status } from "../types";

export interface StatusNodeData {
  label: string;
  status: Status;
  description?: string;
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

      <span className="status-node__label">{d.label}</span>

      {hasDesc && (
        <div className="status-node__tip" role="tooltip">
          {d.description}
        </div>
      )}
    </div>
  );
}
