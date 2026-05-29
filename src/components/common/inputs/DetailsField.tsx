import { memo, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { IconButton } from "@/components/common/Button";
import { MarkdownEditor } from "@/components/common/markdown/MarkdownEditor";
import { formatAllMarkdownTables } from "@/components/common/markdown/MarkdownTables";
import { SuggestionsDropdown } from "@/components/common/dropdowns/SuggestionsDropdown";
import { MarkdownShortcutHelp } from "@/components/common/markdown/MarkdownShortcutHelp";
import { useSuggestionSourcesContext } from "@/hooks/useSuggestionSources";
import { useTokenSuggestionController } from "@/hooks/useTokenSuggestionController";

/**
 * Shared multiline markdown field with token suggestions and optional shortcut help.
 */
function DetailsFieldComponent({
  value,
  onChange,
  onBlur,
  placeholder,
  label = "Details",
  showOptionalHint = true,
  rows = 12,
  showShortcutToggle = true,
  roomSuggestions,
  tagSuggestions,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  label?: string;
  showOptionalHint?: boolean;
  rows?: number;
  showShortcutToggle?: boolean;
  roomSuggestions?: string[];
  tagSuggestions?: string[];
}) {
  const sharedSuggestions = useSuggestionSourcesContext();
  const [showHelp, setShowHelp] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const suggestionsController = useTokenSuggestionController({
    value,
    setValue: onChange,
    cursorPos,
    setCursorPos,
    inputRef: textareaRef,
    roomSuggestions: roomSuggestions ?? sharedSuggestions.roomSuggestions,
    tagSuggestions: tagSuggestions ?? sharedSuggestions.tagSuggestions,
  });

  const shortcutToggle = (
    <IconButton
      aria-label="Toggle shortcut help"
      title="Shortcuts"
      className="h-7 w-7"
      onClick={() => setShowHelp((v) => !v)}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </IconButton>
  );

  return (
    <div className="capture-suggestion-field">
      <label className="capture-label">
        {label}
        {showOptionalHint && (
          <span className="text-muted-foreground/70 normal-case"> (optional)</span>
        )}
      </label>
      <MarkdownEditor
        textareaRef={textareaRef}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onCursorChange={setCursorPos}
        onTextKeyDown={(event) => suggestionsController.onKeyDown(event)}
        onFormatTables={() => onChange(formatAllMarkdownTables(value))}
        placeholder={placeholder}
        rows={rows}
        extraTools={showShortcutToggle ? shortcutToggle : undefined}
      />
      <SuggestionsDropdown
        suggestions={suggestionsController.suggestions}
        activeIndex={suggestionsController.activeIndex}
        onApply={suggestionsController.applySuggestion}
        onHover={suggestionsController.setActiveIndex}
        isOpen={suggestionsController.isOpen}
        style={{
          left: `clamp(0.5rem, calc(0.75rem + ${suggestionsController.tokenAnchor.col}ch), calc(100% - 14rem))`,
          top: `clamp(3.5rem, calc(3.5rem + (${suggestionsController.tokenAnchor.line} + 1) * 1.5rem), calc(100% - 12rem))`,
        }}
        ariaLabel="Details suggestions"
      />
      {showShortcutToggle && showHelp && (
        <div className="mt-1">
          <MarkdownShortcutHelp />
        </div>
      )}
    </div>
  );
}

export const DetailsField = memo(DetailsFieldComponent);
