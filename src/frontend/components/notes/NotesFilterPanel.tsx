import type { NoteType } from "@/lib/types";
import { SelectButton } from "@/frontend/components/common/button";

const TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "observation", label: "Observations" },
  { value: "clue", label: "Clues" },
  { value: "code", label: "Codes" },
  { value: "theory", label: "Theories" },
  { value: "story", label: "Stories" },
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
  setTypeFilter: React.Dispatch<React.SetStateAction<NoteType | null>>;
  statusFilter: "open" | "solved" | null;
  setStatusFilter: React.Dispatch<React.SetStateAction<"open" | "solved" | null>>;
  roomFilter: string | null;
  setRoomFilter: React.Dispatch<React.SetStateAction<string | null>>;
  tagFilter: string | null;
  setTagFilter: React.Dispatch<React.SetStateAction<string | null>>;
  rooms: string[];
  tags: string[];
}) {
  return (
    <div className="notes-view-filters-panel">
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
