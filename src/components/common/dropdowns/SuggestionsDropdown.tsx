import type { CSSProperties } from "react";
import type { TokenSuggestion } from "@/components/common/inputs/TokenSuggestions";

/**
 * Generic suggestion listbox used by token-aware inputs.
 */
export function SuggestionsDropdown({
  suggestions,
  activeIndex,
  onApply,
  ariaLabel,
  onHover,
  style,
  isOpen = true,
}: {
  suggestions: TokenSuggestion[];
  activeIndex: number;
  onApply: (suggestion: TokenSuggestion) => void;
  ariaLabel: string;
  onHover?: (index: number) => void;
  style?: CSSProperties;
  isOpen?: boolean;
}) {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      className="capture-suggestion-dropdown"
      role="listbox"
      aria-label={ariaLabel}
      style={style}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.value}
          type="button"
          className={`capture-suggestion-item ${index === activeIndex ? "capture-suggestion-item-active" : ""}`}
          aria-selected={index === activeIndex}
          onMouseEnter={() => onHover?.(index)}
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
