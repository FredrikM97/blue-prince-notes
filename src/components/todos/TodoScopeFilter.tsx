import { TODO_SCOPE_OPTIONS } from "./constants";

export function TodoScopeFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex gap-1 rounded-md bg-secondary p-1 text-xs">
      {TODO_SCOPE_OPTIONS.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={`rounded px-2 py-1 ${
            value === option.value ? "bg-brass text-brass-foreground" : "text-muted-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
