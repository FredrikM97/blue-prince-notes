// JSON export / import with embedded images as base64.
import {
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
} from "./db";
import type { Note, Todo, StoredImage, RoomState, SectionDef, GridCell } from "./types";

interface ExportFile {
  app: "blue-prince-notes";
  version: 2;
  exportedAt: number;
  notes: Note[];
  todos: Todo[];
  images: Array<Omit<StoredImage, "blob"> & { dataUrl: string }>;
  rooms: RoomState[];
  sections: SectionDef[];
  gridCells?: GridCell[];
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
async function dataUrlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

export async function exportAll(): Promise<void> {
  const [notes, todos, images, rooms, sections, gridCells] = await Promise.all([
    listNotes(),
    listTodos(),
    listImages(),
    listRoomStates(),
    listSections(),
    listGridCells(),
  ]);
  const encodedImages = await Promise.all(
    images.map(async (i) => ({
      id: i.id,
      name: i.name,
      caption: i.caption,
      tags: i.tags,
      mime: i.mime,
      createdAt: i.createdAt,
      dataUrl: await blobToDataUrl(i.blob),
    })),
  );
  const file: ExportFile = {
    app: "blue-prince-notes",
    version: 2,
    exportedAt: Date.now(),
    notes,
    todos,
    images: encodedImages,
    rooms,
    sections,
    gridCells,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blue-prince-notes-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importAll(file: File, mode: "merge" | "replace"): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as ExportFile;
  if (data.app !== "blue-prince-notes") throw new Error("Not a Blue Prince notes export");

  if (mode === "replace") {
    // simple replace: clear stores via a delete-all loop
    const [oldNotes, oldTodos, oldImages] = await Promise.all([
      listNotes(),
      listTodos(),
      listImages(),
    ]);
    const { deleteNote, deleteTodo, deleteImage } = await import("./db");
    await Promise.all([
      ...oldNotes.map((n) => deleteNote(n.id)),
      ...oldTodos.map((t) => deleteTodo(t.id)),
      ...oldImages.map((i) => deleteImage(i.id)),
    ]);
  }

  for (const n of data.notes ?? []) await putNote(n);
  for (const t of data.todos ?? []) await putTodo(t);
  for (const r of data.rooms ?? []) await putRoomState(r);
  for (const s of data.sections ?? []) await putSection(s);
  for (const c of data.gridCells ?? []) await putGridCell(c);
  for (const img of data.images ?? []) {
    const blob = await dataUrlToBlob(img.dataUrl);
    await putImage({
      id: img.id,
      name: img.name,
      caption: img.caption,
      tags: img.tags ?? [],
      mime: img.mime,
      blob,
      createdAt: img.createdAt,
    });
  }
}
