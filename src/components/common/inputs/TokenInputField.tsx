import { useId, useRef, useState } from "react";
import { INPUT_BASE_CLASS } from "@/components/common/FormClasses";
import { SuggestionsDropdown } from "@/components/common/dropdowns/SuggestionsDropdown";
import { useSuggestionSourcesContext } from "@/hooks/useSuggestionSources";
import { useTokenSuggestionController } from "@/hooks/useTokenSuggestionController";
/**
 * Reusable single-line input with token suggestions and keyboard navigation.
 */
export function TokenInputField({
  label,
  value,
  onChange,
  placeholder,
  roomSuggestions,
  tagSuggestions,
  onSubmitShortcut,
  inputClassName,
  ariaLabel,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  roomSuggestions?: string[];
  tagSuggestions?: string[];
  onSubmitShortcut?: (keepOpen: boolean) => void;
  inputClassName?: string;
  ariaLabel: string;
  autoFocus?: boolean;
}) {
  const sharedSuggestions = useSuggestionSourcesContext();
  const [cursorPos, setCursorPos] = useState(value.length);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const suggestionsController = useTokenSuggestionController({
    value,
    setValue: onChange,
    cursorPos,
    setCursorPos,
    inputRef,
    roomSuggestions: roomSuggestions ?? sharedSuggestions.roomSuggestions,
    tagSuggestions: tagSuggestions ?? sharedSuggestions.tagSuggestions,
  });

  return (
    <div className="capture-suggestion-field">
      <label className="capture-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPos(e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? value.length)}
        onKeyUp={(e) =>
          setCursorPos((e.currentTarget as HTMLInputElement).selectionStart ?? value.length)
        }
        onKeyDown={(e) => {
          if (suggestionsController.onKeyDown(e)) return;
          if (!onSubmitShortcut) return;
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmitShortcut(e.shiftKey);
          }
        }}
        placeholder={placeholder}
        className={inputClassName ?? INPUT_BASE_CLASS}
      />

      <SuggestionsDropdown
        suggestions={suggestionsController.suggestions}
        activeIndex={suggestionsController.activeIndex}
        onApply={suggestionsController.applySuggestion}
        onHover={suggestionsController.setActiveIndex}
        isOpen={suggestionsController.isOpen}
        style={{
          left: `clamp(0.5rem, calc(0.75rem + ${suggestionsController.tokenAnchor.col}ch), calc(100% - 14rem))`,
          top: "calc(100% + 0.25rem)",
        }}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
