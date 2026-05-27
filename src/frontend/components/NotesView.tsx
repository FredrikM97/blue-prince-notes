import { useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import type { NoteType } from "@/lib/types";
import { NoteRow } from "./NoteRow";
import { buttonClass } from "@/frontend/components/common/buttonClasses";

const TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "observation", label: "Observations" },
  { value: "clue", label: "Clues" },
  { value: "code", label: "Codes" },
  { value: "theory", label: "Theories" },
  { value: "book", label: "Books" },
];

export function NotesView({
  filterType,
  title,
  emptyHint,
}: {
  filterType?: NoteType;
  title: string;
  emptyHint?: string;
}) {
  const notes = useStore((s) => s.notes);
  const search = useStore((s) => s.search);
  const openCapture = useStore((s) => s.openCapture);
  const [typeFilter, setTypeFilter] = useState<NoteType | null>(null);
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"open" | "solved" | null>(null);

  const effectiveType = filterType ?? typeFilter;

  const rooms = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.room && set.add(n.room));
    return Array.from(set).sort();
  }, [notes]);
  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (effectiveType && n.type !== effectiveType) return false;
      if (roomFilter && n.room !== roomFilter) return false;
      if (tagFilter && !n.tags.includes(tagFilter)) return false;
      if (statusFilter && n.status !== statusFilter) return false;
      if (q) {
        const hay = `${n.title} ${n.body} ${n.tags.join(" ")} ${n.room ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notes, effectiveType, roomFilter, tagFilter, statusFilter, search]);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {!filterType && (
          <FilterGroup
            label="Type"
            options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as NoteType | null)}
          />
        )}
        <FilterGroup
          label="Status"
          options={[
            { value: "open", label: "Open" },
            { value: "solved", label: "Solved" },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as "open" | "solved" | null)}
        />
        {rooms.length > 0 && (
          <FilterGroup
            label="Room"
            options={rooms.map((r) => ({ value: r, label: r }))}
            value={roomFilter}
            onChange={setRoomFilter}
          />
        )}
        {tags.length > 0 && (
          <FilterGroup
            label="Tag"
            options={tags.map((t) => ({ value: t, label: `#${t}` }))}
            value={tagFilter}
            onChange={setTagFilter}
          />
        )}
      </aside>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="font-serif text-2xl">{title}</h1>
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {emptyHint ?? "No notes yet. Press N to add one."}
            </p>
            <button
              className={buttonClass({ className: "mt-4 bg-brass text-brass-foreground hover:bg-brass/90" })}
              onClick={() => openCapture()}
            >
              Add your first note
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {filtered.map((n) => (
              <NoteRow key={n.id} note={n} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onChange(null)}
          className={`rounded px-2 py-0.5 text-xs ${
            value === null ? "bg-brass text-brass-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
            className={`rounded px-2 py-0.5 text-xs ${
              value === o.value
                ? "bg-brass text-brass-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
