import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { IconButton } from "@/components/common/button";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { NotesShortcutHelp } from "@/components/notes/NotesShortcutHelp";
import { formatAllMarkdownTables } from "@/components/common/markdown-table";

export function NoteDetailsField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [showHelp, setShowHelp] = useState(false);

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
    <div>
      <label className="capture-label">
        Details <span className="text-muted-foreground/70 normal-case">(optional)</span>
      </label>
      <MarkdownEditor
        value={value}
        onChange={onChange}
        onFormatTables={() => onChange(formatAllMarkdownTables(value))}
        placeholder={placeholder}
        rows={12}
        extraTools={shortcutToggle}
      />
      {showHelp && (
        <div className="mt-1">
          <NotesShortcutHelp />
        </div>
      )}
    </div>
  );
}