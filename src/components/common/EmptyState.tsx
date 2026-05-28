import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground",
        className,
      )}
    />
  );
}
