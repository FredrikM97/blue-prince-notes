import { memo, useState } from "react";
import { HelpCircle } from "lucide-react";
import { IconButton } from "@/components/common/Button";
import { MarkdownEditor } from "@/components/common/markdown/MarkdownEditor";
import { formatAllMarkdownTables } from "@/components/common/markdown/MarkdownTables";
import { MarkdownShortcutHelp } from "@/components/common/markdown/MarkdownShortcutHelp";

/**
 * Plain multiline markdown field. Wrap with SuggestionsDropdown for token suggestion support.
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
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  label?: string;
  showOptionalHint?: boolean;
  rows?: number;
  showShortcutToggle?: boolean;
}) {
  const [showHelp, setShowHelp] = useState(false);

  const shortcutToggle = showShortcutToggle ? (
    <IconButton
      aria-label="Toggle shortcut help"
      title="Shortcuts"
      className="h-7 w-7"
      onClick={() => setShowHelp((v) => !v)}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </IconButton>
  ) : undefined;

  return (
    <div>
      <label className="capture-label">
        {label}
        {showOptionalHint && (
          <span className="text-muted-foreground/70 normal-case"> (optional)</span>
        )}
      </label>
      <MarkdownEditor
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFormatTables={() => onChange(formatAllMarkdownTables(value))}
        placeholder={placeholder}
        rows={rows}
        extraTools={shortcutToggle}
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
