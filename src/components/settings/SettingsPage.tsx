import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FolderOpen, FolderSync, Unlink } from "lucide-react";
import { useStore } from "@/data/store";
import { Button, BrassButton } from "@/components/common/Button";
import { KeyboardKey } from "@/components/common/KeyboardKey";
import { PageLayout } from "@/components/common/PageLayout";
import {
  addCustomRoom,
  getAllRoomGroups,
  listCustomRooms,
  removeCustomRoom,
  ROOM_GROUPS,
  type RoomCategory,
} from "@/data/rooms";
import { DropdownSelect } from "@/components/common/dropdown/DropdownSelect";
import { exportAll, importAll } from "@/data/io";
import {
  pickSyncFolder,
  disconnectSyncFolder,
  readFromSyncFolder,
  importSyncManifest,
  writeToSyncFolder,
  saveSyncNow,
  loadSyncMode,
  setSyncMode,
  subscribeSyncStatus,
  type SyncMode,
  getActiveSyncHandle,
  getActiveSyncFolderName,
  openSyncFolderInPicker,
} from "@/data/sync";
import {
  isSteamImportSupported,
  loadSteamImportStatus,
  pickAndImportSteamFiles,
} from "@/data/steamImport";
import { toast } from "sonner";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="flex items-center gap-3 font-serif text-xl leading-tight">
        <span aria-hidden className="h-5 w-px bg-border/80" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const load = useStore((s) => s.load);
  const fileRef = useRef<HTMLInputElement>(null);
  const [customRooms, setCustomRooms] = useState(() => listCustomRooms());
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState<RoomCategory>(ROOM_GROUPS[0]);

  const customRoomsByCategory = useMemo(() => {
    const allGroups = getAllRoomGroups();
    const grouped = new Map<string, string[]>();
    allGroups.forEach((group) => grouped.set(group, []));
    customRooms.forEach((room) => {
      if (!grouped.has(room.category)) grouped.set(room.category, []);
      grouped.get(room.category)!.push(room.name);
    });
    return grouped;
  }, [customRooms]);

  const categoryOptions = useMemo(
    () => [...customRoomsByCategory.keys()].map((g) => ({ value: g, label: g })),
    [customRoomsByCategory],
  );

  function addRoom() {
    const roomName = newRoomName.trim();
    if (!roomName) return;
    const next = addCustomRoom(roomName, newRoomCategory);
    setCustomRooms(next);
    setNewRoomName("");
    toast.success("Room added");
  }

  function removeRoom(name: string) {
    const next = removeCustomRoom(name);
    setCustomRooms(next);
    toast.success("Room removed");
  }

  return (
    <PageLayout
      className="h-full max-w-none px-0 py-0 sm:px-0 sm:py-0"
      prioritizeMiddleScroll
      middle={
        <div className="mx-auto w-full max-w-2xl space-y-12 px-3 py-3 pb-6 sm:px-4 sm:py-6 sm:pb-8">
          <header>
            <h1 className="font-serif text-3xl">Settings</h1>
            <p className="text-sm text-muted-foreground">
              All data lives in your browser. Export regularly to keep a backup.
            </p>
          </header>

          <SettingsSection title="Data">
            <div className="flex flex-wrap gap-2">
              <BrassButton onClick={() => exportAll().then(() => toast.success("Exported"))}>
                Export ZIP
              </BrassButton>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Import (merge)...
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const f = fileRef.current;
                  if (!f) return;
                  f.dataset.mode = "replace";
                  f.click();
                }}
              >
                Import (replace)...
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,application/zip,application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const mode = (e.target.dataset.mode as "merge" | "replace") || "merge";
                try {
                  await importAll(f, mode);
                  await load();
                  toast.success("Imported");
                } catch (err) {
                  toast.error((err as Error).message);
                }
                e.target.value = "";
                e.target.dataset.mode = "merge";
              }}
            />

            <div className="space-y-3 border-t border-border/70 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sync folder
              </h3>
              <SyncFolderSection />
            </div>

            <div className="space-y-3 border-t border-border/70 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Steam screenshots import (optional)
              </h3>
              <SteamImportSection />
            </div>
          </SettingsSection>

          <div className="border-t border-border/70 pt-6">
            <SettingsSection title="Rooms">
              <p className="text-xs text-muted-foreground">
                Add custom rooms under any group. They appear in Map, New Note, and Edit Note room
                dropdowns.
              </p>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
                <input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="New room name"
                  className="h-9 rounded-md border border-input bg-card/65 px-3 text-sm"
                />

                <DropdownSelect
                  value={newRoomCategory}
                  onValueChange={(value) => setNewRoomCategory(value as RoomCategory)}
                  options={categoryOptions}
                />

                <Button variant="outline" onClick={addRoom}>
                  Add room
                </Button>
              </div>

              <div className="space-y-3 rounded-md border border-border p-3">
                {[...customRoomsByCategory.entries()].map(([group, rooms]) => {
                  if (rooms.length === 0) return null;

                  return (
                    <div key={group} className="space-y-2">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {group}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {rooms.map((name) => (
                          <button
                            key={`${group}-${name}`}
                            type="button"
                            onClick={() => removeRoom(name)}
                            className="rounded border border-border bg-secondary px-2 py-1 text-xs text-foreground hover:border-destructive hover:text-destructive"
                            title="Remove room"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {customRooms.length === 0 && (
                  <p className="text-xs text-muted-foreground">No custom rooms yet.</p>
                )}
              </div>
            </SettingsSection>
          </div>

          <div className="border-t border-border/70 pt-6">
            <SettingsSection title="Keyboard">
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <KeyboardKey>N</KeyboardKey> - open quick capture
                </li>
                <li>
                  <KeyboardKey>Esc</KeyboardKey> - close capture
                </li>
                <li>
                  <KeyboardKey>Ctrl+Enter</KeyboardKey> - save ·{" "}
                  <KeyboardKey>Ctrl+Shift+Enter</KeyboardKey> - save &amp; keep open
                </li>
              </ul>
            </SettingsSection>
          </div>
        </div>
      }
    />
  );
}

function SteamImportSection() {
  const addImage = useStore((s) => s.addImage);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [lastImported, setLastImported] = useState(0);
  const [lastSkipped, setLastSkipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const isSupported = isSteamImportSupported();

  useEffect(() => {
    if (!isSupported) return;
    void loadSteamImportStatus().then((s) => {
      setLastRefreshAt(s.lastRefreshAt);
      setLastImported(s.lastImported);
      setLastSkipped(s.lastSkipped);
    });
  }, [isSupported]);

  async function handlePickFiles() {
    setBusy(true);
    try {
      const result = await pickAndImportSteamFiles(addImage);
      if (result === null) return; // user cancelled
      setLastRefreshAt(Date.now());
      setLastImported(result.imported);
      setLastSkipped(result.skipped);
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} screenshot${result.imported === 1 ? "" : "s"}`);
      } else {
        toast.success("No new screenshots — all already imported");
      }
    } catch {
      toast.error("Could not import Steam screenshots");
    } finally {
      setBusy(false);
    }
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground">
        Your browser does not support file access. Steam import requires Chrome or Edge.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pick screenshot files directly — works with any folder including Steam&apos;s installation
        directory. Already-imported files are skipped automatically.
      </p>

      <Button variant="outline" size="sm" onClick={handlePickFiles} disabled={busy}>
        Pick screenshots…
      </Button>

      <p className="text-xs text-muted-foreground">
        Last import:{" "}
        {lastRefreshAt
          ? `${new Date(lastRefreshAt).toLocaleString()} · imported ${lastImported}, skipped ${lastSkipped}`
          : "Never"}
      </p>
    </div>
  );
}

function SyncFolderSection() {
  const syncFolderName = useStore((s) => s.syncFolderName);
  const setSyncFolderName = useStore((s) => s.setSyncFolderName);
  const load = useStore((s) => s.load);
  const [busy, setBusy] = useState(false);
  const [syncMode, setSyncModeState] = useState<SyncMode>("auto");
  const [dirty, setDirty] = useState(false);
  const [lastDirtyAt, setLastDirtyAt] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const lastReminderRef = useRef<number>(0);

  const isSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  useEffect(() => {
    void loadSyncMode().then(setSyncModeState);
    const unsubscribe = subscribeSyncStatus((status) => {
      setSyncModeState(status.mode);
      setDirty(status.dirty);
      setLastDirtyAt(status.lastDirtyAt);
      setLastSyncedAt(status.lastSyncedAt);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (syncMode !== "manual" || !dirty || !lastDirtyAt || !reminderEnabled) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const dirtyFor = now - lastDirtyAt;
      const sinceLastReminder = now - lastReminderRef.current;
      if (dirtyFor < 5 * 60_000) return;
      if (sinceLastReminder < 5 * 60_000) return;
      lastReminderRef.current = now;
      toast("Unsynced changes", {
        description: "Manual sync is enabled. Press 'Save to disk now' to persist recent changes.",
      });
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [syncMode, dirty, lastDirtyAt, reminderEnabled]);

  async function handleModeChange(nextMode: SyncMode) {
    setBusy(true);
    try {
      await setSyncMode(nextMode);
      toast.success(nextMode === "manual" ? "Manual sync enabled" : "Auto sync enabled");
    } catch {
      toast.error("Could not update sync mode");
    } finally {
      setBusy(false);
    }
  }

  async function handleConnect() {
    setBusy(true);
    try {
      const handle = await pickSyncFolder();
      if (!handle) {
        setBusy(false);
        return;
      }
      const existing = await readFromSyncFolder(handle);
      if (existing) {
        await importSyncManifest(existing);
        await load();
        toast.success(`Loaded and syncing with "${handle.name}"`);
      } else {
        // Write current data into the new folder immediately
        await writeToSyncFolder(handle);
        toast.success(`Connected — data will sync to "${handle.name}"`);
      }
      setSyncFolderName(getActiveSyncFolderName() ?? handle.name);
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("system files") || message.includes("sensitive")) {
        toast.error("That folder is restricted by the browser. Pick a normal folder instead.");
      } else {
        toast.error("Could not connect to folder");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    await disconnectSyncFolder();
    setSyncFolderName(null);
    toast.success("Sync folder disconnected");
  }

  async function handleSyncNow() {
    if (!getActiveSyncHandle()) return;
    setBusy(true);
    try {
      await saveSyncNow();
      toast.success("Saved to disk");
    } catch {
      toast.error("Sync failed — folder permission may have been revoked");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenSyncFolder() {
    try {
      const opened = await openSyncFolderInPicker();
      if (!opened) return;
      toast.success("Opened sync folder picker");
    } catch {
      toast.error("Could not open sync folder picker");
    }
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground">
        Your browser does not support the File System Access API. Try Chrome or Edge.
      </p>
    );
  }

  if (syncFolderName) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-sm">
          <FolderSync className="h-4 w-4 shrink-0 text-green-500" />
          <span className="min-w-0 flex-1 truncate font-medium">{syncFolderName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {syncMode === "manual" ? "manual sync" : "auto-syncing"}
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={syncMode === "manual"}
            onChange={(e) => void handleModeChange(e.target.checked ? "manual" : "auto")}
            disabled={busy}
          />
          Manual sync mode
        </label>
        {syncMode === "manual" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
            />
            Remind every 5 minutes when unsynced for a while
          </label>
        )}
        {dirty && (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsynced changes</p>
        )}
        <p className="text-xs text-muted-foreground">
          Sync writes manifest.json plus image files in images/. Place this folder inside Dropbox,
          OneDrive, or iCloud Drive to sync across devices.
        </p>
        <p className="text-xs text-muted-foreground">
          {lastSyncedAt
            ? `Last saved: ${new Date(lastSyncedAt).toLocaleString()}`
            : "Last saved: never"}
          {dirty && lastDirtyAt
            ? ` • Unsynced since ${new Date(lastDirtyAt).toLocaleTimeString()}`
            : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {syncMode === "manual" ? (
            <BrassButton size="sm" onClick={handleSyncNow} disabled={busy || !dirty}>
              Save to disk now
            </BrassButton>
          ) : (
            <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={busy}>
              Sync now
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleOpenSyncFolder} disabled={busy}>
            Open folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="text-destructive hover:text-destructive"
          >
            <Unlink className="mr-1.5 h-3.5 w-3.5" />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect a local folder and the app will keep <code>manifest.json</code> and an{" "}
        <code>images/</code> folder up to date after every change.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={syncMode === "manual"}
          onChange={(e) => void handleModeChange(e.target.checked ? "manual" : "auto")}
          disabled={busy}
        />
        Use manual sync mode when connected
      </label>
      <BrassButton onClick={handleConnect} disabled={busy}>
        <FolderOpen className="mr-2 h-4 w-4" />
        Connect folder…
      </BrassButton>
    </div>
  );
}
