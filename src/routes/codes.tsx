import { createFileRoute } from "@tanstack/react-router";
import { NotesView } from "@/components/NotesView";

export const Route = createFileRoute("/codes")({
  head: () => ({ meta: [{ title: "Codes — Blue Prince Notes" }] }),
  component: () => <NotesView filterType="code" title="Codes" emptyHint="No codes recorded yet." />,
});
