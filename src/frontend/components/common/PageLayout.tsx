import type { ReactNode } from "react";

/**
 * Standard page wrapper with optional left and right sidebars.
 *
 * - `leftSidebar` — sticky left column (filters, context, nav).
 * - `middle` — explicit middle content slot (preferred for consistency).
 * - `rightSidebar` — sticky right column (detail/edit panels).
 * - `className` — forwarded to the root element.
 */
export function PageLayout({
  leftSidebar,
  middle,
  rightSidebar,
  children,
  className,
}: {
  leftSidebar?: ReactNode;
  middle?: ReactNode;
  rightSidebar?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const layoutClass = [
    "page-layout",
    leftSidebar && rightSidebar
      ? "page-layout-three-column"
      : leftSidebar
        ? "page-layout-two-column-left"
        : rightSidebar
          ? "page-layout-two-column-right"
          : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClass}>
      {leftSidebar && <aside className="page-layout-sidebar">{leftSidebar}</aside>}
      <main className="page-layout-content">{middle ?? children}</main>
      {rightSidebar && <aside className="page-layout-rightbar">{rightSidebar}</aside>}
    </div>
  );
}
