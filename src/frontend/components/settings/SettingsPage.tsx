import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/frontend/data/store";
import { Button, BrassButton } from "@/frontend/components/common/button";
import { KeyboardKey } from "@/frontend/components/common/KeyboardKey";
import { PageLayout } from "@/frontend/components/common/PageLayout";
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
