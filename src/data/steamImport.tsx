import { deleteMeta, getMeta, setMeta } from "./db";

interface DirHandle {
  readonly name: string;
  queryPermission?(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission?(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
}

type AddImageFn = (blob: Blob, name?: string, caption?: string) => Promise<unknown>;

const STEAM_IMPORT_DIR_HANDLE_META_KEY = "steam-import-dir-handle";
const STEAM_IMPORT_ENABLED_META_KEY = "steam-import-enabled";
const STEAM_IMPORT_SIGNATURES_META_KEY = "steam-import-signatures";
const STEAM_IMPORT_LAST_STATUS_META_KEY = "steam-import-last-status";

export interface SteamImportStatus {
  lastRefreshAt: number | null;
  lastImported: number;
  lastSkipped: number;
}

interface SteamImportState extends SteamImportStatus {
  folderName: string | null;
  enabled: boolean;
}

let _handle: DirHandle | null = null;
let _enabled = false;
let _loaded = false;

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".bmp")
  );
}

async function ensureLoaded() {
  if (_loaded) return;
  _enabled = Boolean(await getMeta<boolean>(STEAM_IMPORT_ENABLED_META_KEY));
  _handle = (await getMeta<DirHandle>(STEAM_IMPORT_DIR_HANDLE_META_KEY)) ?? null;
  _loaded = true;
}

async function ensureReadablePermission(handle: DirHandle): Promise<boolean> {
  try {
    const query = await handle.queryPermission?.({ mode: "read" });
    if (query === "granted") return true;
    if (query === "denied") return false;

    const requested = await handle.requestPermission?.({ mode: "read" });
    return requested === "granted";
  } catch {
    return true;
  }
}

async function listImageFiles(handle: DirHandle): Promise<File[]> {
  const files: File[] = [];
  const rawHandle = handle as unknown as {
    values?: () => AsyncIterable<unknown>;
    entries?: () => AsyncIterable<[string, unknown]>;
  };
  const iterator = rawHandle.values ? rawHandle.values() : rawHandle.entries?.();
  if (!iterator) return files;

  for await (const item of iterator) {
    const entry = Array.isArray(item) ? item[1] : item;
    const fileHandle = entry as { kind?: string; getFile?: () => Promise<File> };
    if (fileHandle.kind !== "file" || !fileHandle.getFile) continue;
    const file = await fileHandle.getFile();
    if (isImageFile(file)) files.push(file);
  }

  return files;
}

export async function loadSteamImportState(): Promise<SteamImportState> {
  await ensureLoaded();
  const lastStatus =
    (await getMeta<SteamImportStatus>(STEAM_IMPORT_LAST_STATUS_META_KEY)) ??
    ({ lastRefreshAt: null, lastImported: 0, lastSkipped: 0 } as SteamImportStatus);

  return {
    folderName: _handle?.name ?? null,
    enabled: _enabled,
    ...lastStatus,
  };
}

export async function pickSteamImportFolder(): Promise<string | null> {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) return null;
  const handle = await window.showDirectoryPicker({ mode: "read" });
  _handle = handle as unknown as DirHandle;
  await setMeta(STEAM_IMPORT_DIR_HANDLE_META_KEY, handle);
  await setMeta(STEAM_IMPORT_SIGNATURES_META_KEY, [] as string[]);
  return _handle.name;
}

export async function disconnectSteamImportFolder(): Promise<void> {
  _handle = null;
  await deleteMeta(STEAM_IMPORT_DIR_HANDLE_META_KEY);
  await deleteMeta(STEAM_IMPORT_SIGNATURES_META_KEY);
}

export async function setSteamImportEnabled(enabled: boolean): Promise<void> {
  _enabled = enabled;
  await setMeta(STEAM_IMPORT_ENABLED_META_KEY, enabled);
}

export async function refreshSteamFolderImages(
  addImage: AddImageFn,
): Promise<{ imported: number; skipped: number }> {
  await ensureLoaded();
  if (!_enabled || !_handle) return { imported: 0, skipped: 0 };

  const canRead = await ensureReadablePermission(_handle);
  if (!canRead) {
    throw new Error("Folder permission denied");
  }

  const files = await listImageFiles(_handle);
  const previous = (await getMeta<string[]>(STEAM_IMPORT_SIGNATURES_META_KEY)) ?? [];
  const signatures = new Set(previous);
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const signature = `${_handle.name}|${file.name}|${file.size}|${file.lastModified}`;
    if (signatures.has(signature)) {
      skipped += 1;
      continue;
    }
    await addImage(file, file.name, file.name);
    signatures.add(signature);
    imported += 1;
  }

  await setMeta(STEAM_IMPORT_SIGNATURES_META_KEY, Array.from(signatures));
  await setMeta(STEAM_IMPORT_LAST_STATUS_META_KEY, {
    lastRefreshAt: Date.now(),
    lastImported: imported,
    lastSkipped: skipped,
  } satisfies SteamImportStatus);
  return { imported, skipped };
}
