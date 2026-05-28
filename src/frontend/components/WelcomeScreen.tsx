import { useRef, useState } from "react";
import { FolderOpen, Sparkles, Upload, Waypoints } from "lucide-react";
import { importAll } from "@/frontend/data/io";
import { pickSyncFolder, readFromSyncFolder, importSyncManifest } from "@/frontend/data/sync";
import { useStore } from "@/frontend/data/store";
import { toast } from "sonner";

function WelcomeCard({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-border bg-card/60 p-6 text-center transition-colors hover:border-brass/60 hover:bg-card disabled:pointer-events-none disabled:opacity-50 sm:w-[17rem] ${className ?? ""}`}
    >
      <Icon className="h-8 w-8 text-brass" />
      <div>
        <p className="font-serif text-base font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function WelcomeScreen({
  onDone,
  onContinue,
  showContinueSuggestion,
}: {
  onDone: (syncFolderName?: string) => void;
  onContinue?: () => void;
  showContinueSuggestion?: boolean;
}) {
  const load = useStore((s) => s.load);
  const startFresh = useStore((s) => s.startFresh);
  const fileRef = useRef<HTMLInputElement>(null);
  const [connecting, setConnecting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleStartFresh() {
    setResetting(true);
    try {
      await startFresh();
      toast.success("Started fresh");
      onDone();
    } catch {
      toast.error("Could not reset existing data");
    } finally {
      setResetting(false);
    }
  }

  async function handleConnectFolder() {
    setConnecting(true);
    try {
      const handle = await pickSyncFolder();
      if (!handle) {
        setConnecting(false);
        return;
      }
      const existing = await readFromSyncFolder(handle);
      if (existing) {
        await importSyncManifest(existing);
        await load();
        toast.success(`Loaded data from "${handle.name}"`);
      } else {
        toast.success(`Connected to "${handle.name}" — data will sync here automatically`);
      }
      onDone(handle.name);
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("system files") || message.includes("sensitive")) {
        toast.error("That folder is restricted by the browser. Pick a normal subfolder instead.");
      } else {
        toast.error("Could not connect to folder");
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleImport(file: File) {
    try {
      await importAll(file, "replace");
      await load();
      toast.success("Data imported");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl space-y-8 text-center">
        <div>
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brass/15 text-brass">
            <span className="font-serif text-3xl font-bold">B</span>
          </div>
          <h1 className="font-serif text-3xl">Welcome to Blue Prince Notes</h1>
          <p className="mt-2 text-sm text-muted-foreground">How would you like to get started?</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {showContinueSuggestion && onContinue ? (
            <WelcomeCard
              icon={Waypoints}
              title="Continue"
              description="Pick up where you left off"
              onClick={onContinue}
            />
          ) : null}
          <WelcomeCard
            icon={Sparkles}
            title="Start fresh"
            description="Clear existing data and begin with an empty notebook"
            onClick={handleStartFresh}
            disabled={resetting || connecting}
          />
          <WelcomeCard
            icon={Upload}
            title="Import backup"
            description="Load a ZIP or JSON export"
            onClick={() => fileRef.current?.click()}
          />
          <WelcomeCard
            icon={FolderOpen}
            title="Sync folder"
            description="Pick a local or cloud-backed folder to auto-sync"
            onClick={handleConnectFolder}
            disabled={connecting || resetting}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          You can always import, export, or configure a sync folder later in{" "}
          <strong>Settings</strong>.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".zip,application/zip,application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await handleImport(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
