export type Status = "todo" | "in_progress" | "done" | "blocked";

export interface Card {
  id: string;
  title: string;
  status: Status;
  elementId: string; // id of the linked node or edge
  elementType: "node" | "edge";
  description?: string;
}

export const STATUS_ORDER: Status[] = ["todo", "in_progress", "done", "blocked"];

export const STATUS_LABEL: Record<Status, string> = {
  todo: "Not deployed",
  in_progress: "In progress",
  done: "Deployed",
  blocked: "Blocked",
};

export const STATUS_COLOR: Record<Status, string> = {
  todo: "#9ca3af", // grey
  in_progress: "#3b82f6", // blue
  done: "#22c55e", // green
  blocked: "#ef4444", // red
};
