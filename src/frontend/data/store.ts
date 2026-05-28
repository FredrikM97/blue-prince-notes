import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  isBrowser,
  listNotes,
  listTodos,
  listImages,
  listRoomStates,
  listSections,
  listGridCells,
  putNote,
  putTodo,
  putImage,
  putRoomState,
  putSection,
  putGridCell,
  deleteGridCell,
  deleteNote as dbDeleteNote,
  deleteTodo as dbDeleteTodo,
  deleteImage as dbDeleteImage,
  deleteSection as dbDeleteSection,
} from "./db";
import type {
  Note,
  Todo,
  StoredImage,
  RoomState,
  SectionDef,
  GridCell,
  NoteType,
  NoteStatus,
  TodoStatus,
  TodoScope,
  RunScope,
  Priority,
} from "@/lib/types";
import { cellId } from "./rooms";
import { parseCapture } from "./parse";

interface State {
  loaded: boolean;
  notes: Note[];
  todos: Todo[];
  images: StoredImage[];
  rooms: RoomState[];
  sections: SectionDef[];
  gridCells: GridCell[];
  search: string;
  captureOpen: boolean;
  captureDefault: "note" | "todo";
  capturePrefill: string;
  capturePrefillRoom?: string;
  capturePrefillBody: string;
  capturePrefillTags: string;
  capturePrefillType?: NoteType;
  capturePrefillPriority?: Priority;
  captureEditNoteId?: string;
  captureEditTodoId?: string;

  load: () => Promise<void>;
  setSearch: (q: string) => void;
  openCapture: (opts?: {
    kind?: "note" | "todo";
    prefill?: string;
    room?: string;
    note?: Note;
    todo?: Todo;
  }) => void;
  closeCapture: () => void;

  createFromCapture: (
    raw: string,
    opts?: {
      kind?: "note" | "todo";
      imageBlobs?: Blob[];
      body?: string;
      type?: NoteType;
      room?: string;
      tags?: string[];
      priority?: Priority;
    },
  ) => Promise<{ noteId?: string; todoId?: string }>;
  saveNote: (n: Note) => Promise<void>;
  saveTodo: (t: Todo) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  toggleTodoStatus: (id: string, status: TodoStatus) => Promise<void>;

  addImage: (blob: Blob, name?: string, caption?: string) => Promise<StoredImage>;
  updateImage: (img: StoredImage) => Promise<void>;
  removeImage: (id: string) => Promise<void>;

  setRoomStatus: (name: string, status: RoomState["status"]) => Promise<void>;

  addSection: (label: string) => Promise<void>;
  removeSection: (id: string) => Promise<void>;

  // Grid
  upsertCell: (cell: Partial<GridCell> & { row: number; col: number }) => Promise<void>;
  clearCell: (row: number, col: number) => Promise<void>;
}

const BUILTIN_SECTIONS: SectionDef[] = [
  { id: "notes", label: "Notes", builtin: "notes", order: 0 },
  { id: "todos", label: "Todo", builtin: "todos", order: 1 },
  { id: "map", label: "Map", builtin: "map", order: 2 },
  { id: "graph", label: "Graph", builtin: "graph", order: 3 },
  { id: "books", label: "Story", filter: { type: "story" }, order: 4 },
  { id: "images", label: "Images", builtin: "images", order: 5 },
];

const SEEDED_MAP_CELLS: Array<Pick<GridCell, "row" | "col" | "roomName" | "status">> = [
  { row: 0, col: 2, roomName: "Antechamber", status: "unknown" },
  { row: 8, col: 2, roomName: "Entrance Hall", status: "unknown" },
];

async function ensureSeed(existing: SectionDef[]) {
  const existingById = new Map(existing.map((s) => [s.id, s]));

  // Remove deprecated section ids from older seeds/imports.
  const deprecatedIds = new Set(["codes"]);
  for (const id of deprecatedIds) {
    if (existingById.has(id)) await dbDeleteSection(id);
  }

  for (const builtin of BUILTIN_SECTIONS) {
    const prev = existingById.get(builtin.id);
    if (!prev) {
      await putSection(builtin);
      continue;
    }

    const next: SectionDef = {
      ...prev,
      label: builtin.label,
      order: builtin.order,
      builtin: builtin.builtin,
      filter: builtin.filter,
    };

    const changed =
      prev.label !== next.label
      || prev.order !== next.order
      || prev.builtin !== next.builtin
      || prev.filter?.type !== next.filter?.type;

    if (changed) await putSection(next);
  }
}

async function ensureGridSeed(existing: GridCell[]) {
  const existingIds = new Set(existing.map((c) => c.id));
  const now = Date.now();
  for (const seed of SEEDED_MAP_CELLS) {
    const id = cellId(seed.row, seed.col);
    if (existingIds.has(id)) continue;
    await putGridCell({
      id,
      row: seed.row,
      col: seed.col,
      roomName: seed.roomName,
      status: seed.status,
      updatedAt: now,
    });
  }
}

export const useStore = create<State>((set, get) => ({
  loaded: false,
  notes: [],
  todos: [],
  images: [],
  rooms: [],
  sections: [],
  gridCells: [],
  search: "",
  captureOpen: false,
  captureDefault: "note",
  capturePrefill: "",
  capturePrefillRoom: undefined,
  capturePrefillBody: "",
  capturePrefillTags: "",
  capturePrefillType: undefined,
  capturePrefillPriority: undefined,
  captureEditNoteId: undefined,
  captureEditTodoId: undefined,

  async load() {
    if (!isBrowser()) return;
    const sections = await listSections();
    await ensureSeed(sections);
    const [notes, todos, images, rooms, sections2, gridCells] = await Promise.all([
      listNotes(),
      listTodos(),
      listImages(),
      listRoomStates(),
      listSections(),
      listGridCells(),
    ]);
    await ensureGridSeed(gridCells);
    const seededGridCells = await listGridCells();
    set({
      notes,
      todos,
      images,
      rooms,
      sections: sections2.sort((a, b) => a.order - b.order),
      gridCells: seededGridCells,
      loaded: true,
    });
  },

  setSearch: (q) => set({ search: q }),
  openCapture: (opts) => {
    const note = opts?.note;
    const todo = opts?.todo;

    if (note) {
      set({
        captureOpen: true,
        captureDefault: "note",
        capturePrefill: note.title,
        capturePrefillRoom: note.room,
        capturePrefillBody: note.body,
        capturePrefillTags: note.tags.join(", "),
        capturePrefillType: note.type,
        capturePrefillPriority: undefined,
        captureEditNoteId: note.id,
        captureEditTodoId: undefined,
      });
      return;
    }

    if (todo) {
      set({
        captureOpen: true,
        captureDefault: "todo",
        capturePrefill: todo.title,
        capturePrefillRoom: todo.room,
        capturePrefillBody: todo.notes ?? "",
        capturePrefillTags: todo.tags.join(", "),
        capturePrefillType: undefined,
        capturePrefillPriority: todo.priority,
        captureEditNoteId: undefined,
        captureEditTodoId: todo.id,
      });
      return;
    }

    set({
      captureOpen: true,
      captureDefault: opts?.kind ?? "note",
      capturePrefill: opts?.prefill ?? "",
      capturePrefillRoom: opts?.room,
      capturePrefillBody: "",
      capturePrefillTags: "",
      capturePrefillType: undefined,
      capturePrefillPriority: undefined,
      captureEditNoteId: undefined,
      captureEditTodoId: undefined,
    });
  },
  closeCapture: () => set({
    captureOpen: false,
    capturePrefill: "",
    capturePrefillRoom: undefined,
    capturePrefillBody: "",
    capturePrefillTags: "",
    capturePrefillType: undefined,
    capturePrefillPriority: undefined,
    captureEditNoteId: undefined,
    captureEditTodoId: undefined,
  }),

  async createFromCapture(raw, opts) {
    const parsed = parseCapture(raw);
    const kind = opts?.kind ?? (parsed.isTodo ? "todo" : "note");
    const now = Date.now();
    const imageIds: string[] = [];
    if (opts?.imageBlobs?.length) {
      for (const b of opts.imageBlobs) {
        const img = await get().addImage(b);
        imageIds.push(img.id);
      }
    }
    const room = opts?.room ?? parsed.room;
    const tags = Array.from(new Set([...(opts?.tags ?? []), ...parsed.tags]));
    if (kind === "todo") {
      const todo: Todo = {
        id: nanoid(),
        title: parsed.title,
        room,
        tags,
        status: parsed.status === "solved" ? "done" : "open",
        priority: opts?.priority ?? parsed.priority ?? "med",
        scope: (parsed.scope === "this-run" ? "this-run" : "cross-run") as TodoScope,
        linkedNoteIds: [],
        createdAt: now,
        updatedAt: now,
        completedAt: parsed.status === "solved" ? now : undefined,
      };
      await putTodo(todo);
      set((s) => ({ todos: [todo, ...s.todos] }));
      return { todoId: todo.id };
    }
    const note: Note = {
      id: nanoid(),
      type: opts?.type ?? parsed.type,
      title: parsed.title,
      body: opts?.body?.trim() ?? "",
      room,
      tags,
      date: parsed.date,
      status: parsed.status as NoteStatus,
      scope: parsed.scope as RunScope,
      imageIds,
      createdAt: now,
      updatedAt: now,
    };
    await putNote(note);
    set((s) => ({ notes: [note, ...s.notes] }));
    return { noteId: note.id };
  },

  async saveNote(n) {
    const updated = { ...n, updatedAt: Date.now() };
    await putNote(updated);
    set((s) => ({ notes: [updated, ...s.notes.filter((x) => x.id !== n.id)] }));
  },
  async saveTodo(t) {
    const updated = { ...t, updatedAt: Date.now() };
    await putTodo(updated);
    set((s) => ({ todos: [updated, ...s.todos.filter((x) => x.id !== t.id)] }));
  },
  async removeNote(id) {
    await dbDeleteNote(id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },
  async removeTodo(id) {
    await dbDeleteTodo(id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },
  async toggleTodoStatus(id, status) {
    const t = get().todos.find((x) => x.id === id);
    if (!t) return;
    const next: Todo = {
      ...t,
      status,
      completedAt: status === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    };
    await putTodo(next);
    set((s) => ({ todos: s.todos.map((x) => (x.id === id ? next : x)) }));
  },

  async addImage(blob, name, caption) {
    const img: StoredImage = {
      id: nanoid(),
      name: name ?? `image-${Date.now()}`,
      caption,
      tags: [],
      mime: blob.type || "image/png",
      blob,
      createdAt: Date.now(),
    };
    await putImage(img);
    set((s) => ({ images: [img, ...s.images] }));
    return img;
  },
  async updateImage(img) {
    await putImage(img);
    set((s) => ({ images: s.images.map((x) => (x.id === img.id ? img : x)) }));
  },
  async removeImage(id) {
    await dbDeleteImage(id);
    set((s) => ({ images: s.images.filter((i) => i.id !== id) }));
  },

  async setRoomStatus(name, status) {
    const r: RoomState = { name, status, updatedAt: Date.now() };
    await putRoomState(r);
    set((s) => ({
      rooms: s.rooms.some((x) => x.name === name)
        ? s.rooms.map((x) => (x.name === name ? r : x))
        : [...s.rooms, r],
    }));
  },

  async addSection(label) {
    const sections = get().sections;
    const s: SectionDef = { id: nanoid(), label, order: sections.length };
    await putSection(s);
    set((st) => ({ sections: [...st.sections, s].sort((a, b) => a.order - b.order) }));
  },
  async removeSection(id) {
    await dbDeleteSection(id);
    set((s) => ({ sections: s.sections.filter((x) => x.id !== id) }));
  },

  async upsertCell(patch) {
    const id = cellId(patch.row, patch.col);
    const existing = get().gridCells.find((c) => c.id === id);
    const next: GridCell = {
      id,
      row: patch.row,
      col: patch.col,
      roomName: patch.roomName ?? existing?.roomName,
      comment: patch.comment ?? existing?.comment,
      status: patch.status ?? existing?.status ?? "unknown",
      updatedAt: Date.now(),
    };
    await putGridCell(next);
    set((s) => ({
      gridCells: s.gridCells.some((c) => c.id === id)
        ? s.gridCells.map((c) => (c.id === id ? next : c))
        : [...s.gridCells, next],
    }));
  },
  async clearCell(row, col) {
    const id = cellId(row, col);
    await deleteGridCell(id);
    set((s) => ({ gridCells: s.gridCells.filter((c) => c.id !== id) }));
  },
}));

// Hook for image blob URLs
export function useImageUrl(image: StoredImage | undefined): string | undefined {
  if (!image || typeof URL === "undefined") return undefined;
  return URL.createObjectURL(image.blob);
}
