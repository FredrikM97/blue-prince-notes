export type NoteType = "clue" | "code" | "observation" | "theory" | "story" | "task";

export type NoteStatus = "open" | "solved" | "stale";
export type RunScope = "this-run" | "cross-run";

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  body: string;
  room?: string;
  tags: string[];
  date?: string;
  status: NoteStatus;
  scope: RunScope;
  imageIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type TodoStatus = "open" | "in-progress" | "done";
export type Priority = "low" | "med" | "high";
export type TodoScope = "this-run" | "cross-run" | "someday";

export interface Todo {
  id: string;
  title: string;
  notes?: string;
  room?: string;
  tags: string[];
  status: TodoStatus;
  priority: Priority;
  scope: TodoScope;
  linkedNoteIds: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface StoredImage {
  id: string;
  name: string;
  caption?: string;
  tags: string[];
  mime: string;
  blob: Blob;
  createdAt: number;
}

export interface RoomState {
  name: string;
  status: "unknown" | "drafted" | "explored" | "cleared";
  updatedAt: number;
}

export interface SectionDef {
  id: string;
  label: string;
  filter?: { type?: NoteType };
  builtin?: "notes" | "todos" | "map" | "graph" | "images";
  order: number;
  hidden?: boolean;
}

// A cell on the 5x9 Mt. Holly map grid. Empty cells are not stored.
export interface GridCell {
  id: string; // "row,col"
  row: number;
  col: number;
  roomName?: string;
  comment?: string;
  status: "unknown" | "drafted" | "explored" | "cleared";
  updatedAt: number;
}
