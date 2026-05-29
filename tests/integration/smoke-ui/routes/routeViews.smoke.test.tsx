import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStoreState = {
  sections: [] as Array<{
    id: string;
    label: string;
    builtin?: string;
    filter?: { type?: string };
  }>,
};

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    HeadContent: () => null,
    Outlet: () => <div data-testid="mock-outlet" />,
    Scripts: () => null,
    useRouter: () => ({ invalidate: vi.fn() }),
  };
});

vi.mock("@/data/store", () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

vi.mock("@/components/notes/NotesPage", () => ({
  NotesPage: (props: Record<string, unknown>) => (
    <div data-testid="notes-page">notes:{JSON.stringify(props)}</div>
  ),
}));

vi.mock("@/components/settings/SettingsPage", () => ({
  SettingsPage: () => <div data-testid="settings-page">settings</div>,
}));

vi.mock("@/components/todos/TodosPage", () => ({
  TodosPage: () => <div data-testid="todos-page">todos</div>,
}));

vi.mock("@/components/map/MapPage", () => ({
  MapPage: () => <div data-testid="map-page">map</div>,
}));

vi.mock("@/components/images/ImagesPage", () => ({
  ImagesPage: () => <div data-testid="images-page">images</div>,
}));

vi.mock("@/components/graph/GraphPage", () => ({
  GraphPage: () => <div data-testid="graph-page">graph</div>,
}));

import { NotFoundView, NotesIndexView, SectionView } from "@/routes/__root";

describe("route views smoke snapshots", () => {
  beforeEach(() => {
    mockStoreState.sections = [];
  });

  it("matches snapshot for not-found route shell", () => {
    const { asFragment } = render(<NotFoundView />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for notes index route", () => {
    const { asFragment } = render(<NotesIndexView />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for builtin section route mapping", () => {
    mockStoreState.sections = [
      { id: "todos", label: "Todo", builtin: "todos" },
      { id: "map", label: "Map", builtin: "map" },
      { id: "graph", label: "Graph", builtin: "graph" },
      { id: "images", label: "Images", builtin: "images" },
      { id: "settings", label: "Settings" },
    ];

    const todosView = render(<SectionView id="todos" />);
    const mapView = render(<SectionView id="map" />);
    const graphView = render(<SectionView id="graph" />);
    const imagesView = render(<SectionView id="images" />);
    const settingsView = render(<SectionView id="settings" />);

    expect(todosView.asFragment()).toMatchSnapshot();
    expect(mapView.asFragment()).toMatchSnapshot();
    expect(graphView.asFragment()).toMatchSnapshot();
    expect(imagesView.asFragment()).toMatchSnapshot();
    expect(settingsView.asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for custom notes section route", () => {
    mockStoreState.sections = [
      {
        id: "books",
        label: "Story",
        filter: { type: "story" },
      },
    ];

    const { asFragment } = render(<SectionView id="books" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for missing section route", () => {
    mockStoreState.sections = [{ id: "notes", label: "Notes", builtin: "notes" }];

    const { asFragment } = render(<SectionView id="missing" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
