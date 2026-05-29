import { getMeta, setMeta } from "./db";

type AddImageFn = (blob: Blob, name?: string, caption?: string) => Promise<unknown>;

const STEAM_IMPORT_SIGNATURES_META_KEY = "steam-import-signatures";
const STEAM_IMPORT_LAST_STATUS_META_KEY = "steam-import-last-status";

export interface SteamImportStatus {
  lastRefreshAt: number | null;
  lastImported: number;
  lastSkipped: number;
}

export function isSteamImportSupported(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}
export async function loadSteamImportStatus(): Promise<SteamImportStatus> {
  return (
    (await getMeta<SteamImportStatus>(STEAM_IMPORT_LAST_STATUS_META_KEY)) ?? {
      lastRefreshAt: null,
      lastImported: 0,
      lastSkipped: 0,
    }
  );
}

/**
 * Opens a multi-file picker (works with system directories unlike showDirectoryPicker),
 * reads the selected image files, deduplicates against previous imports, and imports new ones.
 */
export async function pickAndImportSteamFiles(
  addImage: AddImageFn,
): Promise<{ imported: number; skipped: number } | null> {
  if (!isSteamImportSupported()) return null;

  let fileHandles: FileSystemFileHandle[];
  try {
    // showOpenFilePicker is not in all TypeScript DOM libs yet
    type FilePicker = (opts: unknown) => Promise<FileSystemFileHandle[]>;
    const picker = (window as unknown as { showOpenFilePicker: FilePicker }).showOpenFilePicker;
    fileHandles = await picker({
      multiple: true,
      types: [
        {
          description: "Images",
          accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp"],
          },
        },
      ],
    });
  } catch (err) {
    // User cancelled the picker
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }

  const previous = (await getMeta<string[]>(STEAM_IMPORT_SIGNATURES_META_KEY)) ?? [];
  const signatures = new Set(previous);
  let imported = 0;
  let skipped = 0;

  for (const handle of fileHandles) {
    const file = await handle.getFile();
    const signature = `${file.name}|${file.size}|${file.lastModified}`;
    if (signatures.has(signature)) {
      skipped += 1;
      continue;
    }
    await addImage(file, file.name, file.name);
    signatures.add(signature);
    imported += 1;
  }

  await setMeta(STEAM_IMPORT_SIGNATURES_META_KEY, Array.from(signatures));
  const status: SteamImportStatus = {
    lastRefreshAt: Date.now(),
    lastImported: imported,
    lastSkipped: skipped,
  };
  await setMeta(STEAM_IMPORT_LAST_STATUS_META_KEY, status);
  return { imported, skipped };
}
