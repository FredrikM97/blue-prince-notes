import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { Note, Todo, StoredImage, RoomState, SectionDef, GridCell } from "./types";

interface BPSchema extends DBSchema {
  notes: { key: string; value: Note; indexes: { "by-updated": number; "by-type": string; "by-room": string } };
  todos: { key: string; value: Todo; indexes: { "by-updated": number; "by-status": string } };
  images: { key: string; value: StoredImage };
  rooms: { key: string; value: RoomState };
  sections: { key: string; value: SectionDef };
  grid: { key: string; value: GridCell };
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<BPSchema>> | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB unavailable (SSR)");
  }
  if (!dbPromise) {
    dbPromise = openDB<BPSchema>("blue-prince-notes", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const notes = db.createObjectStore("notes", { keyPath: "id" });
          notes.createIndex("by-updated", "updatedAt");
          notes.createIndex("by-type", "type");
          notes.createIndex("by-room", "room");
          const todos = db.createObjectStore("todos", { keyPath: "id" });
          todos.createIndex("by-updated", "updatedAt");
          todos.createIndex("by-status", "status");
          db.createObjectStore("images", { keyPath: "id" });
          db.createObjectStore("rooms", { keyPath: "name" });
          db.createObjectStore("sections", { keyPath: "id" });
          db.createObjectStore("meta");
        }
        if (oldVersion < 2) {
          db.createObjectStore("grid", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export const isBrowser = () => typeof window !== "undefined" && typeof indexedDB !== "undefined";

// Notes
export async function listNotes(): Promise<Note[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("notes", "by-updated");
  return all.reverse();
}
export async function putNote(n: Note) {
  const db = await getDB();
  await db.put("notes", n);
}
export async function deleteNote(id: string) {
  const db = await getDB();
  await db.delete("notes", id);
}
export async function getNote(id: string) {
  const db = await getDB();
  return db.get("notes", id);
}

// Todos
export async function listTodos(): Promise<Todo[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("todos", "by-updated");
  return all.reverse();
}
export async function putTodo(t: Todo) {
  const db = await getDB();
  await db.put("todos", t);
}
export async function deleteTodo(id: string) {
  const db = await getDB();
  await db.delete("todos", id);
}

// Images
export async function listImages(): Promise<StoredImage[]> {
  const db = await getDB();
  return db.getAll("images");
}
export async function putImage(i: StoredImage) {
  const db = await getDB();
  await db.put("images", i);
}
export async function deleteImage(id: string) {
  const db = await getDB();
  await db.delete("images", id);
}
export async function getImage(id: string) {
  const db = await getDB();
  return db.get("images", id);
}

// Rooms
export async function listRoomStates(): Promise<RoomState[]> {
  const db = await getDB();
  return db.getAll("rooms");
}
export async function putRoomState(r: RoomState) {
  const db = await getDB();
  await db.put("rooms", r);
}

// Sections
export async function listSections(): Promise<SectionDef[]> {
  const db = await getDB();
  return db.getAll("sections");
}
export async function putSection(s: SectionDef) {
  const db = await getDB();
  await db.put("sections", s);
}
export async function deleteSection(id: string) {
  const db = await getDB();
  await db.delete("sections", id);
}

// Grid cells
export async function listGridCells(): Promise<GridCell[]> {
  const db = await getDB();
  return db.getAll("grid");
}
export async function putGridCell(c: GridCell) {
  const db = await getDB();
  await db.put("grid", c);
}
export async function deleteGridCell(id: string) {
  const db = await getDB();
  await db.delete("grid", id);
}
