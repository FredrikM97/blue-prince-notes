import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Italic, Table, List, ListOrdered, Eye, EyeOff, WandSparkles } from "lucide-react";
import { TEXTAREA_BASE_CLASS } from "@/components/common/formClasses";
import { IconButton } from "@/components/common/button";
import { findTableBlockAtCursor, formatTableMarkdown } from "@/components/common/markdown-table";

// ── toolbar actions ───────────────────────────────────────────────
type WrapMode = "inline" | "block-line";
interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix?: string;
  mode?: WrapMode;
}

const ACTIONS: ToolbarAction[] = [
  { icon: <Bold className="h-3.5 w-3.5" />, label: "Bold", prefix: "**", suffix: "**" },
  { icon: <Italic className="h-3.5 w-3.5" />, label: "Italic", prefix: "_", suffix: "_" },
  {
    icon: <List className="h-3.5 w-3.5" />,
    label: "Bullet list",
    prefix: "- ",
    mode: "block-line",
  },
  {
    icon: <ListOrdered className="h-3.5 w-3.5" />,
    label: "Numbered list",
    prefix: "1. ",
    mode: "block-line",
  },
  {
    icon: <Table className="h-3.5 w-3.5" />,
    label: "Table",
    prefix: "\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell     | Cell     |\n",
    mode: "block-line",
  },
];

function applyAction(
  textarea: HTMLTextAreaElement,
  action: ToolbarAction,
  setValue: (v: string) => void,
) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);
  let next: string;
  let newStart: number;
  let newEnd: number;

  if (action.mode === "block-line") {
    if (action.label === "Table") {
      const didFormat = tryFormatTableInEditor(textarea, setValue);
      if (didFormat) {
        return;
      }

      if (!selected.trim()) {
        const template =
          "\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell     | Cell     |\n";
        next = value.slice(0, start) + template + value.slice(end);
        newStart = start + template.length;
        newEnd = newStart;
        setValue(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(newStart, newEnd);
        });
        return;
      }
    }

    // prepend prefix to the start of each selected line (or current line)
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = end === start ? value.indexOf("\n", start) + 1 || value.length : end;
    const lines = value.slice(lineStart, lineEnd);
    const prefixed = lines
      .split("\n")
      .map((l) => (l.length ? `${action.prefix}${l}` : l))
      .join("\n");
    next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    newStart = lineStart;
    newEnd = lineStart + prefixed.length;
  } else {
    const suffix = action.suffix ?? action.prefix;
    const inserted = `${action.prefix}${selected || "text"}${suffix}`;
    next = value.slice(0, start) + inserted + value.slice(end);
    newStart = start + action.prefix.length;
    newEnd = newStart + (selected || "text").length;
  }

  setValue(next);
  // Restore cursor after React re-renders
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(newStart, newEnd);
  });
}

function tryFormatTableInEditor(
  textarea: HTMLTextAreaElement,
  setValue: (v: string) => void,
): boolean {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);

  if (selected.trim()) {
    const formatted = formatTableMarkdown(selected);
    if (!formatted) return false;

    const next = value.slice(0, start) + formatted + value.slice(end);
    const nextStart = start;
    const nextEnd = start + formatted.length;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
    return true;
  }

  const block = findTableBlockAtCursor(value, start);
  if (!block) return false;

  const formatted = formatTableMarkdown(block.text);
  if (!formatted) return false;

  const next = value.slice(0, block.start) + formatted + value.slice(block.end);
  const nextStart = block.start;
  const nextEnd = block.start + formatted.length;
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(nextStart, nextEnd);
  });
  return true;
}

function findTableCellJump(value: string, cursor: number, reverse: boolean) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  let lineEnd = value.indexOf("\n", cursor);
  if (lineEnd === -1) lineEnd = value.length;

  const line = value.slice(lineStart, lineEnd);
  if (!line.includes("|")) return null;

  const localCursor = cursor - lineStart;
  const pipes: number[] = [];
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === "|") pipes.push(i);
  }
  if (pipes.length < 2) return null;

  if (reverse) {
    for (let i = pipes.length - 1; i >= 0; i -= 1) {
      if (pipes[i] < localCursor - 1) {
        return lineStart + Math.min(line.length, pipes[i] + 2);
      }
    }
    return null;
  }

  for (let i = 0; i < pipes.length; i += 1) {
    if (pipes[i] > localCursor) {
      return lineStart + Math.min(line.length, pipes[i] + 2);
    }
  }

  return null;
}

// ── component ────────────────────────────────────────────────────
export function MarkdownEditor({
  value,
  onChange,
  onFormatTables,
  placeholder,
  rows = 6,
  className,
  extraTools,
}: {
  value: string;
  onChange: (v: string) => void;
  onFormatTables?: () => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  extraTools?: React.ReactNode;
}) {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={className}>
      <div
        className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-input bg-muted/40 px-1.5 py-1"
        role="toolbar"
        aria-label="Formatting tools"
      >
        {ACTIONS.map((action) => (
          <IconButton
            key={action.label}
            aria-label={action.label}
            title={action.label}
            className="h-7 w-7"
            onClick={() => ref.current && applyAction(ref.current, action, onChange)}
          >
            {action.icon}
          </IconButton>
        ))}
        {onFormatTables && (
          <>
            <div className="mx-1 h-4 w-px bg-border" />
            <IconButton
              aria-label="Format tables"
              title="Format tables"
              className="h-7 w-7"
              onClick={onFormatTables}
            >
              <WandSparkles className="h-3.5 w-3.5" />
            </IconButton>
          </>
        )}
        <div className="mx-1 h-4 w-px bg-border" />
        {extraTools}
        {extraTools && <div className="mx-1 h-4 w-px bg-border" />}
        <IconButton
          aria-label={preview ? "Hide preview" : "Show preview"}
          title={preview ? "Hide preview" : "Show preview"}
          className="h-7 w-7"
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </IconButton>
      </div>

      {preview ? (
        <div className="markdown-preview-surface prose prose-sm dark:prose-invert min-h-[6rem] max-w-none rounded-b-md border border-input bg-background p-3 text-sm leading-relaxed">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && !e.metaKey && !e.ctrlKey && !e.altKey && ref.current) {
              const next = findTableCellJump(value, ref.current.selectionStart, e.shiftKey);
              if (next !== null) {
                e.preventDefault();
                ref.current.setSelectionRange(next, next);
                return;
              }
            }

            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
              if (!ref.current) return;
              const didFormat = tryFormatTableInEditor(ref.current, onChange);
              if (didFormat) {
                e.preventDefault();
              }
            }
          }}
          placeholder={placeholder}
          rows={rows}
          className={`${TEXTAREA_BASE_CLASS} rounded-t-none rounded-b-md border-t-0 font-mono text-[13px] leading-6 [font-variant-numeric:tabular-nums]`}
        />
      )}
    </div>
  );
}
