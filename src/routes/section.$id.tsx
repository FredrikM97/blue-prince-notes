import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { NotesView } from "@/components/NotesView";

export const Route = createFileRoute("/section/$id")({
  head: () => ({ meta: [{ title: "Section — Blue Prince Notes" }] }),
  component: SectionPage,
});

function SectionPage() {
  const { id } = Route.useParams();
  const sections = useStore((s) => s.sections);
  const section = useMemo(() => sections.find((s) => s.id === id), [sections, id]);
  if (!section) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground">
        Section not found.
      </div>
    );
  }
  return <NotesView filterType={section.filter?.type} title={section.label} />;
}
