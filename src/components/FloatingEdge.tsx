import { useRef, useState, useEffect } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "./floating";
import { useStore } from "../store";

export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  data,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const renameCard = useStore((s) => s.renameCard);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(label ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when label changes externally
  useEffect(() => {
    if (!editing) setDraft(String(label ?? ""));
  }, [label, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!sourceNode?.measured?.width || !targetNode?.measured?.width) return null;

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
  const [path, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const cardId = data?.cardId as string | undefined;
  const labelColor = (style?.stroke as string) ?? "#6b7280";

  const commitRename = () => {
    if (cardId) renameCard(cardId, draft || String(label ?? ""));
    setEditing(false);
  };

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          {editing ? (
            <input
              ref={inputRef}
              className="nodrag nopan floating-edge-label-edit"
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                color: labelColor,
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                if (e.key === "Escape") { e.preventDefault(); setDraft(String(label ?? "")); setEditing(false); }
              }}
              onBlur={commitRename}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="floating-edge-label"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                color: labelColor,
                pointerEvents: "all",
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
                setDraft(String(label ?? ""));
              }}
              title="Double-click to rename"
            >
              {label}
            </div>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
}
