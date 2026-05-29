import type { InternalNode } from "@xyflow/react";

// Intersection of the line between two node centers with the first node's box.
// Standard React Flow "floating edges" geometry.
function getNodeIntersection(node: InternalNode, target: InternalNode) {
  const w = (node.measured.width ?? 0) / 2;
  const h = (node.measured.height ?? 0) / 2;
  const nx = node.internals.positionAbsolute.x;
  const ny = node.internals.positionAbsolute.y;
  const tx = target.internals.positionAbsolute.x;
  const ty = target.internals.positionAbsolute.y;

  const x2 = nx + w;
  const y2 = ny + h;
  const x1 = tx + (target.measured.width ?? 0) / 2;
  const y1 = ty + (target.measured.height ?? 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;

  return { x: w * (xx3 + yy3) + x2, y: h * (-xx3 + yy3) + y2 };
}

export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sp = getNodeIntersection(source, target);
  const tp = getNodeIntersection(target, source);
  return { sx: sp.x, sy: sp.y, tx: tp.x, ty: tp.y };
}
