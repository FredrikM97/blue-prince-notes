import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page wrapper with optional left sidebar slot.
 * The right side panel (SidebarPanel) is always portaled and doesn't need a slot here.
 *
 * - `sidebar` — sticky left column (filters, nav). Triggers a 2-column grid layout.
 * - `panelOpen` — when true, adds right padding to make room for the SidebarPanel overlay.
 * - `className` — forwarded to the root element; use tailwind-merge-safe overrides (e.g. `max-w-2xl`).
 */
export function PageLayout({
  sidebar,
  children,
  panelOpen = false,
  className,
}: {
  sidebar?: ReactNode;
  children: ReactNode;
  panelOpen?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("page-layout", sidebar && "page-layout-grid", className)}>
      {sidebar && <aside className="page-layout-sidebar">{sidebar}</aside>}
      <main className={cn("page-layout-content", panelOpen && "page-layout-content-offset")}>
        {children}
      </main>
    </div>
  );
}
