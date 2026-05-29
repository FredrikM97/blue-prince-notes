import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesView } from "../../../src/components/notes/NotesView";
import { MapLeftPanel } from "../../../src/components/map/MapLeftPanel";
import { MapMiddlePanel } from "../../../src/components/map/MapMiddlePanel";
import { ImagesLeftPanel } from "../../../src/components/images/ImagesLeftPanel";
import { GraphRightPanel } from "../../../src/components/graph/GraphRightPanel";
import { TodoLeftPanel } from "../../../src/components/todos/TodoLeftPanel";
import type { Note, Todo } from "../../../src/lib/types";

vi.mock("../../../src/components/common/AttachedImagesGallery", () => ({
  AttachedImagesGallery: () => <div data-testid="attached-images-gallery" />,
}));

const baseNote: Note = {
  id: "note-1",
  type: "clue",
  title: "Find the hidden key",
  body: "Check @Entrance-Hall and #keys",
  room: "Entrance Hall",
  tags: ["keys"],
  status: "open",
  scope: "this-run",
  imageIds: [],
  createdAt: 1,
  updatedAt: 1,
};

const baseTodo: Todo = {
  id: "todo-1",
  title: "Check west wing",
  notes: "Look for clues",
  room: "Parlor",
  tags: ["path"],
  status: "open",
  priority: "med",
  scope: "this-run",
  linkedNoteIds: [],
  createdAt: 1,
  updatedAt: 1,
};

describe("smoke panels", () => {
  it("matches snapshot for notes list row and actions", () => {
    const onOpenEdit = vi.fn();
    const onOpenPreview = vi.fn();
    const onDelete = vi.fn();
    const { asFragment } = render(
      <NotesView
        filtered={[baseNote]}
        openCapture={vi.fn()}
        onOpenEdit={onOpenEdit}
        onOpenPreview={onOpenPreview}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit note" }));
    expect(onOpenEdit).toHaveBeenCalledWith(baseNote);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for map shell and supports opening a cell", () => {
    const onOpenCell = vi.fn();
    const { asFragment } = render(
      <>
        <MapLeftPanel />
        <MapMiddlePanel
          byId={new Map()}
          noteCountByRoom={new Map()}
          statusColor={{
            unknown: "map-cell-neutral",
            drafted: "map-cell-neutral",
            explored: "map-cell-neutral",
            cleared: "map-cell-cleared",
          }}
          coordLabel={(row, col) => `${row},${col}`}
          onOpenCell={onOpenCell}
        />
      </>,
    );

    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onOpenCell).toHaveBeenCalled();
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for images left panel", () => {
    const { asFragment } = render(
      <ImagesLeftPanel
        total={3}
        steamImportActive
        steamLastRefreshAt={1_700_000_000_000}
        refreshBusy={false}
        onRefreshSteam={async () => {}}
      />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for graph details panel", () => {
    const { asFragment } = render(
      <GraphRightPanel
        noteCount={2}
        edgeCount={1}
        selectedNote={baseNote}
        incomingCount={1}
        outgoingCount={0}
      />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for todo sidebar panel", () => {
    const { asFragment } = render(
      <TodoLeftPanel
        total={1}
        openCount={1}
        progressCount={0}
        doneCount={0}
        scopeFilter={null}
        setScopeFilter={vi.fn()}
        showRunCard
        thisRunOpen={[baseTodo]}
        onToggleDone={vi.fn()}
      />,
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
