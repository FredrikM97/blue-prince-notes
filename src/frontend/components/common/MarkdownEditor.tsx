import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Italic, Table, List, ListOrdered, Eye, EyeOff } from "lucide-react";
import { TEXTAREA_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { IconButton } from "@/frontend/components/ui/button";

// ── local styles ─────────────────────────────────────────────────
const TOOLBAR_CLASS =
  "flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-input bg-muted/40 px-1.5 py-1";
const TOOLBAR_DIVIDER_CLASS = "mx-1 h-4 w-px bg-border";
const PREVIEW_CLASS =
  "prose prose-sm dark:prose-invert min-h-[6rem] max-w-none rounded-b-md border border-input bg-background p-3 text-sm leading-relaxed";
const TEXTAREA_JOINED_CLASS = "rounded-t-none rounded-b-md border-t-0";

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
    prefix: "\n| Column 1 | Column 2 |\n|---|---|\n| Cell | Cell |\n",
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
    // prepend prefix to the start of each selected line (or current line)
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = end === start ? (value.indexOf("\n", start) + 1 || value.length) : end;
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

// ── component ────────────────────────────────────────────────────
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={className}>
      <div className={TOOLBAR_CLASS} role="toolbar" aria-label="Formatting tools">
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
        <div className={TOOLBAR_DIVIDER_CLASS} />
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
        <div className={PREVIEW_CLASS}>
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
          placeholder={placeholder}
          rows={rows}
          className={`${TEXTAREA_BASE_CLASS} ${TEXTAREA_JOINED_CLASS}`}
        />
      )}
    </div>
  );
}
