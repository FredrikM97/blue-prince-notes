import { useRef } from "react";
import type { ReactNode, WheelEvent } from "react";

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
  prioritizeMiddleScroll,
}: {
  leftSidebar?: ReactNode;
  middle?: ReactNode;
  rightSidebar?: ReactNode;
  children?: ReactNode;
  className?: string;
  prioritizeMiddleScroll?: boolean;
}) {
  const middleRef = useRef<HTMLElement | null>(null);

  function forwardWheelToMiddle(event: WheelEvent<HTMLElement>) {
    if (!prioritizeMiddleScroll) return;
    if (event.deltaY === 0) return;
    const middleEl = middleRef.current;
    if (!middleEl) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    middleEl.scrollTop += event.deltaY;
  }

  const layoutClass = [
    "page-layout",
    prioritizeMiddleScroll ? "page-layout-middle-scroll-priority" : "",
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
      {leftSidebar && (
        <aside className="page-layout-sidebar" onWheel={forwardWheelToMiddle}>
          {leftSidebar}
        </aside>
      )}
      <main ref={middleRef} className="page-layout-content">
        {middle ?? children}
      </main>
      {rightSidebar && (
        <aside className="page-layout-rightbar" onWheel={forwardWheelToMiddle}>
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
