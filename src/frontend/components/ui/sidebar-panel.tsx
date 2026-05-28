import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Dialog, DialogPortal } from "@/frontend/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SidebarPanelProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function SidebarPanel({
  open,
  onClose,
  className,
  children,
  onOpenChange,
}: SidebarPanelProps) {
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen);
      if (!nextOpen) onClose();
    },
    [onClose, onOpenChange],
  );

  return (
    <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Content
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "sidebar-panel-content",
            className,
          )}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
