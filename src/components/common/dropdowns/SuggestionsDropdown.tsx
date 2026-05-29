import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSuggestionSourcesContext } from "@/hooks/useSuggestionSources";
import {
  useTokenSuggestionController,
  useTokenSuggestionDropdownStyle,
} from "@/hooks/useTokenSuggestionController";
import type { TokenSuggestion } from "@/components/common/inputs/TokenSuggestions";

function SuggestionItems({
  suggestions,
  activeIndex,
  onApply,
  onHover,
  isOpen,
  ariaLabel,
  style,
}: {
  suggestions: TokenSuggestion[];
  activeIndex: number;
  onApply: (suggestion: TokenSuggestion) => void;
  onHover: (index: number) => void;
  isOpen: boolean;
  ariaLabel: string;
  style?: CSSProperties;
}) {
  if (!isOpen || suggestions.length === 0) return null;
  return (
    <div className="capture-suggestion-dropdown" role="listbox" aria-label={ariaLabel} style={style}>
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.value}
          type="button"
          className={`capture-suggestion-item ${index === activeIndex ? "capture-suggestion-item-active" : ""}`}
          aria-selected={index === activeIndex}
          onMouseEnter={() => onHover(index)}
          onMouseDown={(e) => {
            e.preventDefault();
            onApply(suggestion);
          }}
        >
          <span>{suggestion.value}</span>
          <span className="capture-suggestion-hint">{suggestion.hint}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Wraps any input or textarea field and adds token suggestions.
 * Intercepts keystrokes via capture phase — the field inside needs no suggestion awareness.
 */
export function SuggestionsDropdown({
  children,
  value,
  onChange,
  ariaLabel,
  onSubmitShortcut,
  roomSuggestions,
  tagSuggestions,
}: {
  children: ReactNode;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  onSubmitShortcut?: (keepOpen: boolean) => void;
  roomSuggestions?: string[];
  tagSuggestions?: string[];
}) {
  const sharedSuggestions = useSuggestionSourcesContext();
  const [cursorPos, setCursorPos] = useState(value.length);
  const inputElRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const controller = useTokenSuggestionController({
    value,
    setValue: onChange,
    cursorPos,
    setCursorPos,
    roomSuggestions: roomSuggestions ?? sharedSuggestions.roomSuggestions,
    tagSuggestions: tagSuggestions ?? sharedSuggestions.tagSuggestions,
    onCommitCursor: (nextCursor) => {
      requestAnimationFrame(() => {
        inputElRef.current?.focus();
        inputElRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    },
  });

  const dropdownStyle = useTokenSuggestionDropdownStyle({
    inputRef: inputElRef,
    value,
    tokenStart: controller.tokenStart,
  });

  function trackInput(target: EventTarget | null) {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      inputElRef.current = target;
      setCursorPos(target.selectionStart ?? value.length);
    }
  }

  return (
    <div
      className="capture-suggestion-field"
      onKeyDownCapture={(e) => {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
        inputElRef.current = e.target;
        if (controller.onKeyDown(e)) return;
        if (onSubmitShortcut && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmitShortcut(e.shiftKey);
        }
      }}
      onKeyUp={(e) => trackInput(e.target)}
      onClick={(e) => trackInput(e.target)}
    >
      {children}
      <SuggestionItems
        suggestions={controller.suggestions}
        activeIndex={controller.activeIndex}
        onApply={controller.applySuggestion}
        onHover={controller.setActiveIndex}
        isOpen={controller.isOpen}
        ariaLabel={ariaLabel}
        style={dropdownStyle}
      />
    </div>
  );
}
