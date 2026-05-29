import type { ReactNode } from "react";
import { Maximize2, X } from "lucide-react";
import { IconButton } from "@/components/common/Button";

/**
 * Shared layout for note and todo right-panel previews.
 * Parent is responsible for wrapping in `notes-right-panel-shell`.
 */
export function RightPreviewPanel({
  title,
  subtitle,
  strikethrough = false,
  onExpand,
  onClose,
  expandDialog,
  children,
}: {
  title: string;
  subtitle?: string;
  strikethrough?: boolean;
  onExpand: () => void;
  onClose: () => void;
  expandDialog?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-layout-panel flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2
            className={`font-serif text-lg leading-snug ${
              strikethrough ? "text-muted-foreground line-through" : ""
            }`}
          >
            {title}
          </h2>
          {subtitle && <p className="text-[11px] text-muted-foreground capitalize">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton onClick={onExpand} title="Expand preview">
            <Maximize2 className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      {children}
      {expandDialog}
    </div>
  );
}
