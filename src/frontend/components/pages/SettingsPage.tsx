import { useMemo, useRef } from "react";
import { useStore } from "@/frontend/data/store";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { exportAll, importAll } from "@/frontend/data/io";
import { toast } from "sonner";

export function SettingsPage() {
  const allSections = useStore((s) => s.sections);
  const sections = useMemo(
    () => allSections.filter((x) => Boolean(x.builtin) || x.id === "books"),
    [allSections],
  );
  const load = useStore((s) => s.load);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          All data lives in your browser. Export regularly to keep a backup.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-serif text-lg">Data</h2>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass({})} onClick={() => exportAll().then(() => toast.success("Exported"))}>
            Export JSON
          </button>
          <button className={buttonClass({ variant: "outline" })} onClick={() => fileRef.current?.click()}>
            Import (merge)...
          </button>
          <button
            className={buttonClass({ variant: "outline" })}
            onClick={async () => {
              const f = fileRef.current;
              if (!f) return;
              f.dataset.mode = "replace";
              f.click();
            }}
          >
            Import (replace)...
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
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
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg">Sections</h2>
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
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg">Keyboard</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li><kbd className="rounded bg-accent px-1">N</kbd> - open quick capture</li>
          <li><kbd className="rounded bg-accent px-1">Esc</kbd> - close capture</li>
          <li><kbd className="rounded bg-accent px-1">Enter</kbd> - save - <kbd className="rounded bg-accent px-1">Shift+Enter</kbd> - save & keep open</li>
        </ul>
      </section>
    </div>
  );
}
