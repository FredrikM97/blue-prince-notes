import { createFileRoute } from "@tanstack/react-router";
import { NotesView } from "@/components/NotesView";

export const Route = createFileRoute("/books")({
  head: () => ({ meta: [{ title: "Books — Blue Prince Notes" }] }),
  component: () => <NotesView filterType="book" title="Books" emptyHint="No book entries yet." />,
});
