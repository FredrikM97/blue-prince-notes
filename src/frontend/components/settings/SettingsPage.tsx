import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/frontend/data/store";
import { Button, BrassButton } from "@/frontend/components/common/button";
import { KeyboardKey } from "@/frontend/components/common/KeyboardKey";
import { PageLayout } from "@/frontend/components/common/PageLayout";
import {
  addCustomRoom,
  listCustomRooms,
  removeCustomRoom,
  ROOM_GROUPS,
  type RoomCategory,
} from "@/frontend/data/rooms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/common/select";
import { exportAll, importAll } from "@/frontend/data/io";
import { toast } from "sonner";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-lg">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const allSections = useStore((s) => s.sections);
  const sections = useMemo(
    () => allSections.filter((x) => Boolean(x.builtin) || x.id === "books"),
    [allSections],
  );
  const load = useStore((s) => s.load);
  const fileRef = useRef<HTMLInputElement>(null);
  const [customRooms, setCustomRooms] = useState(() => listCustomRooms());
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState<RoomCategory>(ROOM_GROUPS[0]);

  const customRoomsByCategory = useMemo(() => {
    const grouped = new Map<RoomCategory, string[]>();
    ROOM_GROUPS.forEach((group) => grouped.set(group, []));
    customRooms.forEach((room) => {
      grouped.get(room.category)?.push(room.name);
    });
    return grouped;
  }, [customRooms]);

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
    <PageLayout className="max-w-2xl space-y-8">
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
      </SettingsSection>

      <SettingsSection title="Sections">
        <p className="text-xs text-muted-foreground">
          Sections are fixed for now. Tag-based custom sections will return in a future update.
        </p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {sections.map((s) => (
            <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="flex-1">{s.label}</span>
              <span className="text-xs text-muted-foreground">
                {s.builtin ? "built-in" : s.filter?.type ? `filter: ${s.filter.type}` : "custom"}
              </span>
            </li>
          ))}
        </ul>
      </SettingsSection>

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

          <Select
            value={newRoomCategory}
            onValueChange={(value) => setNewRoomCategory(value as RoomCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_GROUPS.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={addRoom}>
            Add room
          </Button>
        </div>

        <div className="space-y-3 rounded-md border border-border p-3">
          {ROOM_GROUPS.map((group) => {
            const rooms = customRoomsByCategory.get(group) ?? [];
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
    </PageLayout>
  );
}
