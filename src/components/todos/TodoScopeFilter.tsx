import { TODO_SCOPE_OPTIONS } from "./constants";
import { SelectButton } from "@/components/common/button";

export function TodoScopeFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {TODO_SCOPE_OPTIONS.map((option) => (
        <SelectButton
          key={String(option.value)}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </SelectButton>
      ))}
    </div>
  );
}
