import { getMeta, setMeta } from "./db";

type AddImageFn = (blob: Blob, name?: string, caption?: string) => Promise<unknown>;

const STEAM_IMPORT_SIGNATURES_META_KEY = "steam-import-signatures";
const STEAM_IMPORT_LAST_STATUS_META_KEY = "steam-import-last-status";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);

export interface SteamImportStatus {
  lastRefreshAt: number | null;
  lastImported: number;
  lastSkipped: number;
}

export function isSteamImportSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
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
 * Opens a native OS folder picker via a hidden <input webkitdirectory> element.
 * This approach works with system directories (e.g. Steam screenshot folders) that
 * the File System Access API (showDirectoryPicker) cannot access due to browser sandboxing.
 */
function pickFolder(): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.setAttribute("webkitdirectory", "");

    let settled = false;

    input.addEventListener("change", () => {
      settled = true;
      const files = Array.from(input.files ?? []).filter((f) => {
        const dot = f.name.lastIndexOf(".");
        const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : "";
        return IMAGE_EXTENSIONS.has(ext);
      });
      resolve(files.length > 0 ? files : null);
    });

    // Detect cancel: window regains focus without a change event firing
    window.addEventListener(
      "focus",
      () => {
        setTimeout(() => {
          if (!settled) resolve(null);
        }, 500);
      },
      { once: true },
    );

    input.click();
  });
}

/**
 * Lets the user pick a folder, reads image files from it, deduplicates against
 * previous imports, and saves new ones via addImage.
 */
export async function pickAndImportSteamFiles(
  addImage: AddImageFn,
): Promise<{ imported: number; skipped: number } | null> {
  if (!isSteamImportSupported()) return null;

  const files = await pickFolder();
  if (files === null) return null;

  const previous = (await getMeta<string[]>(STEAM_IMPORT_SIGNATURES_META_KEY)) ?? [];
  const signatures = new Set(previous);
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
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
