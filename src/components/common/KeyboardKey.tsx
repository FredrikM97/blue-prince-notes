import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function KeyboardKey({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <kbd {...props} className={cn("rounded bg-accent px-1 font-mono text-xs", className)} />;
}
