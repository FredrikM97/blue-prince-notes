import { useStore } from "@/lib/store";
import { Plus } from "lucide-react";

export function QuickCaptureFab() {
  const openCapture = useStore((s) => s.openCapture);
  const captureOpen = useStore((s) => s.captureOpen);
  if (captureOpen) return null;
  return (
    <button
      onClick={() => openCapture()}
      className="fixed bottom-6 right-6 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-brass px-5 text-brass-foreground shadow-2xl shadow-black/40 ring-2 ring-brass/40 transition hover:scale-105 hover:bg-brass/90 sm:bottom-8 sm:right-8"
      aria-label="Quick add note"
    >
      <Plus className="h-5 w-5" />
      <span className="font-serif text-base font-semibold">New note</span>
      <kbd className="hidden rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium sm:inline">
        N
      </kbd>
    </button>
  );
}
