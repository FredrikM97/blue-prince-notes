import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRootLayoutWithProviders } from "../../helpers/renderWithProviders";

const ctx = vi.hoisted(() => ({
  sync: {
    restoreSyncHandle: vi.fn<() => Promise<{ name: string } | null>>(async () => null),
    readFromSyncFolder: vi.fn<
      () => Promise<{ manifest: { app: string }; images: unknown[] } | null>
    >(async () => null),
    importSyncManifest: vi.fn(async () => {}),
    getActiveSyncFolderName: vi.fn(() => null as string | null),
  },
  state: {
    load: vi.fn(async () => {}),
    loaded: false,
    notes: [] as Array<{ id: string }>,
    todos: [] as Array<{ id: string }>,
    setSyncFolderName: vi.fn(),
    sections: [] as Array<{
      id: string;
      label: string;
      builtin?: string;
      filter?: { type?: string };
    }>,
  },
}));

vi.mock("@/data/store", () => {
  const useStore = ((selector: (state: typeof ctx.state) => unknown) =>
    selector(ctx.state)) as typeof import("@/data/store").useStore;
  useStore.getState = () => ctx.state as never;
  return { useStore };
});
vi.mock("@/data/sync", () => ctx.sync);
vi.mock("@/components/AppHeader", () => ({
  AppHeader: () => <div data-testid="app-header" />,
}));
vi.mock("@/components/common/Sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));
vi.mock("@/components/notes/NotesPage", () => ({
  NotesPage: () => <div data-testid="notes-page" />,
}));
vi.mock("@/components/settings/SettingsPage", () => ({
  SettingsPage: () => <div data-testid="settings-page" />,
}));
vi.mock("@/components/todos/TodosPage", () => ({
  TodosPage: () => <div data-testid="todos-page" />,
}));
vi.mock("@/components/map/MapPage", () => ({
  MapPage: () => <div data-testid="map-page" />,
}));
vi.mock("@/components/images/ImagesPage", () => ({
  ImagesPage: () => <div data-testid="images-page" />,
}));
vi.mock("@/components/graph/GraphPage", () => ({
  GraphPage: () => <div data-testid="graph-page" />,
}));
vi.mock("@/hooks/useSuggestionSources", () => ({
  SuggestionSourcesContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
  useSuggestionSources: () => ({ roomSuggestions: [], tagSuggestions: [] }),
}));
vi.mock("@/components/WelcomeScreen", () => ({
  WelcomeScreen: ({
    onDone,
    onContinue,
    showContinueSuggestion,
  }: {
    onDone: (folderName?: string) => void;
    onContinue?: () => void;
    showContinueSuggestion?: boolean;
  }) => (
    <div data-testid="welcome-screen">
      <div data-testid="continue-suggestion">{showContinueSuggestion ? "yes" : "no"}</div>
      <button type="button" onClick={() => onContinue?.()}>
        continue
      </button>
      <button type="button" onClick={() => onDone("FromWelcome")}>
        done
      </button>
    </div>
  ),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Outlet: () => <div data-testid="router-outlet" />,
    HeadContent: () => null,
    Scripts: () => null,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
    useRouter: () => ({ invalidate: vi.fn() }),
  };
});

describe("router boot and welcome gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    ctx.state.loaded = false;
    ctx.state.notes = [];
    ctx.state.todos = [];
  });

  it("shows welcome screen for fresh users", async () => {
    renderRootLayoutWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
    });
  });

  it("renders outlet when user already welcomed", async () => {
    localStorage.setItem("bp-welcomed", "1");

    renderRootLayoutWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("router-outlet")).toBeInTheDocument();
    });
  });

  it("restores sync folder and imports when local store is empty", async () => {
    ctx.sync.restoreSyncHandle.mockResolvedValueOnce({ name: "RecoveredSync" });
    ctx.sync.readFromSyncFolder.mockResolvedValueOnce({
      manifest: { app: "blue-prince-notes" },
      images: [],
    });

    renderRootLayoutWithProviders();

    await waitFor(() => {
      expect(ctx.state.setSyncFolderName).toHaveBeenCalledWith("RecoveredSync");
      expect(ctx.sync.importSyncManifest).toHaveBeenCalled();
      expect(ctx.state.load).toHaveBeenCalledTimes(2);
    });
  });

  it("transitions from welcome to ready on continue", async () => {
    renderRootLayoutWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "continue" }));

    await waitFor(() => {
      expect(screen.getByTestId("router-outlet")).toBeInTheDocument();
    });
  });

  it("handles onboarding done callback and stores welcome flag", async () => {
    renderRootLayoutWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "done" }));

    await waitFor(() => {
      expect(ctx.state.setSyncFolderName).toHaveBeenCalledWith("FromWelcome");
      expect(localStorage.getItem("bp-welcomed")).toBe("1");
      expect(screen.getByTestId("router-outlet")).toBeInTheDocument();
    });
  });
});
