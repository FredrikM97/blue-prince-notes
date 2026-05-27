import { createFileRoute } from "@tanstack/react-router";
import { NotesView } from "@/components/NotesView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Notes — Blue Prince Notes" },
      { name: "description", content: "All your Blue Prince notes, clues, codes and theories." },
    ],
  }),
  component: Page,
});

function Page() {
  return <NotesView title="Notes" emptyHint="No notes yet. Press N anywhere to add one." />;
}
