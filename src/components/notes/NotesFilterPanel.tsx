import type { NoteType } from "@/lib/types";
import { SelectButton } from "@/components/common/Button";

const TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "observation", label: "Observations" },
  { value: "clue", label: "Clues" },
  { value: "code", label: "Codes" },
  { value: "theory", label: "Theories" },
  { value: "story", label: "Stories" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "solved", label: "Solved" },
];

export function NotesFilterPanel({
  filterType,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  roomFilter,
  setRoomFilter,
  tagFilter,
  setTagFilter,
  rooms,
  tags,
}: {
  filterType?: NoteType;
  typeFilter: NoteType | null;
  setTypeFilter: (value: NoteType | null) => void;
  statusFilter: "open" | "solved" | null;
  setStatusFilter: (value: "open" | "solved" | null) => void;
  roomFilter: string | null;
  setRoomFilter: (value: string | null) => void;
  tagFilter: string | null;
  setTagFilter: (value: string | null) => void;
  rooms: string[];
  tags: string[];
}) {
  const typeOptions = TYPE_OPTIONS;
  const statusOptions = STATUS_OPTIONS;
  const roomOptions = rooms.map((r) => ({ value: r, label: r }));
  const tagOptions = tags.map((t) => ({ value: t, label: `#${t}` }));

  return (
    <div className="notes-view-filters-panel">
      {!filterType && (
        <FilterGroup
          label="Type"
          options={typeOptions}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as NoteType | null)}
        />
      )}
      <FilterGroup
        label="Status"
        options={statusOptions}
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as "open" | "solved" | null)}
      />
      {rooms.length > 0 && (
        <FilterGroup
          label="Room"
          options={roomOptions}
          value={roomFilter}
          onChange={setRoomFilter}
        />
      )}
      {tags.length > 0 && (
        <FilterGroup label="Tag" options={tagOptions} value={tagFilter} onChange={setTagFilter} />
      )}
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
      <div className="notes-filter-label">{label}</div>
      <div className="notes-filter-wrap">
        <SelectButton active={value === null} onClick={() => onChange(null)}>
          All
        </SelectButton>
        {options.map((o) => (
          <SelectButton
            key={o.value}
            active={value === o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
          >
            {o.label}
          </SelectButton>
        ))}
      </div>
    </div>
  );
}
