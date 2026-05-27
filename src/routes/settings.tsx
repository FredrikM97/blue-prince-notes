import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportAll, importAll } from "@/lib/io";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Blue Prince Notes" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const sections = useStore((s) => s.sections);
  const addSection = useStore((s) => s.addSection);
  const removeSection = useStore((s) => s.removeSection);
  const load = useStore((s) => s.load);
  const [newSec, setNewSec] = useState("");
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
          <Button onClick={() => exportAll().then(() => toast.success("Exported"))}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Import (merge)…
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
            Import (replace)…
          </Button>
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
          Built-in sections can't be deleted. Add custom views to filter notes your way.
        </p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {sections.map((s) => (
            <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="flex-1">{s.label}</span>
              <span className="text-xs text-muted-foreground">
                {s.builtin ? "built-in" : s.filter?.type ? `filter: ${s.filter.type}` : "custom"}
              </span>
              {!s.builtin && !["books", "codes"].includes(s.id) && (
                <button
                  onClick={() => removeSection(s.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (newSec.trim()) {
              await addSection(newSec.trim());
              setNewSec("");
            }
          }}
          className="flex gap-2"
        >
          <Input
            value={newSec}
            onChange={(e) => setNewSec(e.target.value)}
            placeholder="New section name (e.g. Characters)"
          />
          <Button type="submit">Add</Button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg">Keyboard</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li><kbd className="rounded bg-accent px-1">N</kbd> – open quick capture</li>
          <li><kbd className="rounded bg-accent px-1">Esc</kbd> – close capture</li>
          <li><kbd className="rounded bg-accent px-1">Enter</kbd> – save · <kbd className="rounded bg-accent px-1">Shift+Enter</kbd> – save & keep open</li>
        </ul>
      </section>
    </div>
  );
}
