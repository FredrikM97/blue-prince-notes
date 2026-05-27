// ZIP-first export/import. Keeps images as binary files for better performance.
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
import type { Note, Todo, StoredImage, RoomState, SectionDef, GridCell } from "@/lib/types";

let jsZipCtorPromise: Promise<typeof import("jszip").default> | null = null;

async function getJSZipCtor() {
  if (!jsZipCtorPromise) {
    jsZipCtorPromise = import("jszip").then((m) => m.default);
  }
  return jsZipCtorPromise;
}

interface LegacyJsonExportFile {
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

interface ZipExportImageMeta extends Omit<StoredImage, "blob"> {
  file: string;
}

interface ZipExportManifest {
  app: "blue-prince-notes";
  version: 3;
  exportedAt: number;
  notes: Note[];
  todos: Todo[];
  images: ZipExportImageMeta[];
  rooms: RoomState[];
  sections: SectionDef[];
  gridCells?: GridCell[];
}

async function dataUrlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

export async function exportAll(): Promise<void> {
  const JSZip = await getJSZipCtor();
  const [notes, todos, images, rooms, sections, gridCells] = await Promise.all([
    listNotes(),
    listTodos(),
    listImages(),
    listRoomStates(),
    listSections(),
    listGridCells(),
  ]);

  const zip = new JSZip();
  const manifestImages: ZipExportImageMeta[] = [];
  for (const i of images) {
    const filePath = `images/${i.id}`;
    manifestImages.push({
      id: i.id,
      name: i.name,
      caption: i.caption,
      tags: i.tags,
      mime: i.mime,
      createdAt: i.createdAt,
      file: filePath,
    });
    zip.file(filePath, i.blob);
  }

  const manifest: ZipExportManifest = {
    app: "blue-prince-notes",
    version: 3,
    exportedAt: Date.now(),
    notes,
    todos,
    images: manifestImages,
    rooms,
    sections,
    gridCells,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blue-prince-notes-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

async function clearForReplaceMode() {
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

async function importFromLegacyJson(file: File, mode: "merge" | "replace") {
  const text = await file.text();
  const data = JSON.parse(text) as LegacyJsonExportFile;
  if (data.app !== "blue-prince-notes") throw new Error("Not a Blue Prince notes export");

  if (mode === "replace") {
    await clearForReplaceMode();
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

async function importFromZip(file: File, mode: "merge" | "replace") {
  const JSZip = await getJSZipCtor();
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) throw new Error("Invalid backup zip: missing manifest.json");

  const manifestText = await manifestFile.async("text");
  const data = JSON.parse(manifestText) as ZipExportManifest;
  if (data.app !== "blue-prince-notes") throw new Error("Not a Blue Prince notes export");

  if (mode === "replace") {
    await clearForReplaceMode();
  }

  for (const n of data.notes ?? []) await putNote(n);
  for (const t of data.todos ?? []) await putTodo(t);
  for (const r of data.rooms ?? []) await putRoomState(r);
  for (const s of data.sections ?? []) await putSection(s);
  for (const c of data.gridCells ?? []) await putGridCell(c);

  for (const img of data.images ?? []) {
    const imageFile = zip.file(img.file);
    if (!imageFile) continue;
    const blob = await imageFile.async("blob");
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

export async function importAll(file: File, mode: "merge" | "replace"): Promise<void> {
  const fileName = file.name.toLowerCase();
  const isZip = fileName.endsWith(".zip") || file.type === "application/zip";
  if (isZip) {
    await importFromZip(file, mode);
    return;
  }
  await importFromLegacyJson(file, mode);
}
