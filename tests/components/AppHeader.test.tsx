import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "../../src/components/AppHeader";

const mockNavigate = vi.fn();
const mockState = {
  sections: [
    { id: "notes", label: "Notes", builtin: "notes" },
    { id: "todos", label: "Todo", builtin: "todos" },
    { id: "map", label: "Map", builtin: "map" },
    { id: "books", label: "Story", filter: { type: "story" } },
    { id: "hidden", label: "Hidden", builtin: "graph", hidden: true },
  ],
  search: "",
  setSearch: vi.fn(),
  openCapture: vi.fn(),
  captureOpen: false,
  closeCapture: vi.fn(),
  load: vi.fn(async () => {}),
  syncFolderName: null as string | null,
  pathname: "/",
};

const mockExportAll = vi.fn(async () => {});
const mockImportAll = vi.fn(async () => {});
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (value: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: mockState.pathname } }),
}));

vi.mock("../../src/data/store", () => ({
  useStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock("../../src/data/io", () => ({
  exportAll: () => mockExportAll(),
  importAll: (...args: unknown[]) => mockImportAll(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("../../src/components/common/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">theme-toggle</button>,
}));

vi.mock("../../src/components/common/dropdowns/DropdownMenu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

describe("AppHeader", () => {
  beforeEach(() => {
    mockState.pathname = "/";
    mockState.search = "";
    mockState.captureOpen = false;
    mockState.syncFolderName = null;
    mockState.setSearch.mockClear();
    mockState.openCapture.mockClear();
    mockState.closeCapture.mockClear();
    mockState.load.mockClear();
    mockNavigate.mockClear();
    mockExportAll.mockClear();
    mockImportAll.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("renders core nav links and hides hidden sections", () => {
    render(<AppHeader />);

    expect(screen.getByText("Blue Prince Notes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Todo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Story" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Hidden" })).not.toBeInTheDocument();
  });

  it("updates search value through store setter", async () => {
    render(<AppHeader />);
    fireEvent.change(screen.getByLabelText("Search notes"), { target: { value: "entrance" } });

    await waitFor(() => {
      expect(mockState.setSearch).toHaveBeenCalledWith("entrance");
    });
  });

  it("opens note capture from add button on root", () => {
    render(<AppHeader />);
    fireEvent.click(screen.getByRole("button", { name: /Add note/i }));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockState.openCapture).toHaveBeenCalledWith({
      kind: "note",
      noteType: undefined,
      returnTo: undefined,
    });
  });

  it("navigates home and opens capture from non-creatable section", () => {
    mockState.pathname = "/section/todos";
    render(<AppHeader />);

    fireEvent.keyDown(window, { key: "n" });

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    expect(mockState.openCapture).toHaveBeenCalledWith({
      kind: "note",
      noteType: undefined,
      returnTo: "/section/todos",
    });
  });

  it("closes capture when route cannot create in place", () => {
    mockState.pathname = "/section/todos";
    mockState.captureOpen = true;

    render(<AppHeader />);

    expect(mockState.closeCapture).toHaveBeenCalled();
  });

  it("shows sync folder badge when sync is active", () => {
    mockState.syncFolderName = "BluePrinceSync";
    render(<AppHeader />);

    expect(screen.getByTitle('Syncing to "BluePrinceSync"')).toBeInTheDocument();
  });

  it("imports backup and reloads store", async () => {
    render(<AppHeader />);

    const file = new File(["{}"], "backup.json", { type: "application/json" });
    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockImportAll).toHaveBeenCalledWith(file, "merge");
      expect(mockState.load).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith("Imported");
    });
  });

  it("handles import error and shows toast", async () => {
    mockImportAll.mockRejectedValueOnce(new Error("bad import"));
    render(<AppHeader />);

    const file = new File(["bad"], "bad.json", { type: "application/json" });
    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("bad import");
    });
  });

  it("dispatches welcome event when brand link is clicked", () => {
    const listener = vi.fn();
    window.addEventListener("bp:show-welcome", listener);
    render(<AppHeader />);

    fireEvent.click(screen.getByRole("link", { name: /Blue Prince Notes/i }));

    expect(listener).toHaveBeenCalled();
    window.removeEventListener("bp:show-welcome", listener);
  });
});
