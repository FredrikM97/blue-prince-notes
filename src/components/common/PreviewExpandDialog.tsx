import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/Dialog";

/**
 * Shared full-screen expanded preview dialog.
 * Used by NotesRightPanel and TodoPreviewDialog to show a scrollable
 * expanded view of preview content.
 */
export function PreviewExpandDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[90vw] max-w-4xl flex-col gap-3 p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
