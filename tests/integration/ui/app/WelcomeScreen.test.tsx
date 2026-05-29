import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeScreen } from "@/components/WelcomeScreen";

const hoisted = vi.hoisted(() => ({
  mockImportAll: vi.fn(async () => {}),
  mockPickSyncFolder: vi.fn<() => Promise<{ name: string } | null>>(async () => null),
  mockReadFromSyncFolder: vi.fn<
    () => Promise<{ manifest: { app: string }; images: unknown[] } | null>
  >(async () => null),
  mockImportSyncManifest: vi.fn<(payload: unknown) => Promise<void>>(async () => {}),
  mockGetActiveSyncFolderName: vi.fn(() => null as string | null),
}));

const mockStore = {
  load: vi.fn(async () => {}),
  startFresh: vi.fn(async () => {}),
};

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/data/store", () => ({
  useStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

vi.mock("@/data/io", () => ({
  importAll: hoisted.mockImportAll,
}));

vi.mock("@/data/sync", () => ({
  pickSyncFolder: hoisted.mockPickSyncFolder,
  readFromSyncFolder: hoisted.mockReadFromSyncFolder,
  importSyncManifest: hoisted.mockImportSyncManifest,
  getActiveSyncFolderName: hoisted.mockGetActiveSyncFolderName,
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

describe("WelcomeScreen", () => {
  beforeEach(() => {
    mockStore.load.mockClear();
    mockStore.startFresh.mockClear();
    hoisted.mockImportAll.mockClear();
    hoisted.mockPickSyncFolder.mockClear();
    hoisted.mockReadFromSyncFolder.mockClear();
    hoisted.mockImportSyncManifest.mockClear();
    hoisted.mockGetActiveSyncFolderName.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("shows continue option when suggested", () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onDone={vi.fn()} onContinue={onContinue} showContinueSuggestion />);

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("starts fresh and calls onDone", async () => {
    const onDone = vi.fn();
    render(<WelcomeScreen onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: /Start fresh/i }));

    await waitFor(() => {
      expect(mockStore.startFresh).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith("Started fresh");
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("handles start fresh failure", async () => {
    mockStore.startFresh.mockRejectedValueOnce(new Error("fail"));
    render(<WelcomeScreen onDone={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Start fresh/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Could not reset existing data");
    });
  });

  it("connects folder with existing manifest and imports data", async () => {
    const onDone = vi.fn();
    hoisted.mockPickSyncFolder.mockResolvedValueOnce({ name: "SyncDir" });
    hoisted.mockReadFromSyncFolder.mockResolvedValueOnce({
      manifest: { app: "blue-prince-notes" },
      images: [],
    });

    render(<WelcomeScreen onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Sync folder/i }));

    await waitFor(() => {
      expect(hoisted.mockImportSyncManifest).toHaveBeenCalled();
      expect(mockStore.load).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith('Loaded data from "SyncDir"');
      expect(onDone).toHaveBeenCalledWith("SyncDir");
    });
  });

  it("connects folder without existing manifest", async () => {
    const onDone = vi.fn();
    hoisted.mockPickSyncFolder.mockResolvedValueOnce({ name: "SyncDir" });
    hoisted.mockReadFromSyncFolder.mockResolvedValueOnce(null);
    hoisted.mockGetActiveSyncFolderName.mockReturnValueOnce("ActiveFolder");

    render(<WelcomeScreen onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Sync folder/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        'Connected to "SyncDir" — data will sync here automatically',
      );
      expect(onDone).toHaveBeenCalledWith("ActiveFolder");
    });
  });

  it("handles restricted folder error", async () => {
    hoisted.mockPickSyncFolder.mockRejectedValueOnce(new Error("Sensitive system files"));
    render(<WelcomeScreen onDone={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Sync folder/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "That folder is restricted by the browser. Pick a normal folder instead.",
      );
    });
  });

  it("imports backup and finishes onboarding", async () => {
    const onDone = vi.fn();
    render(<WelcomeScreen onDone={onDone} />);

    const file = new File(["{}"], "backup.json", { type: "application/json" });
    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(hoisted.mockImportAll).toHaveBeenCalledWith(file, "replace");
      expect(mockStore.load).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith("Data imported");
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("handles import error message", async () => {
    hoisted.mockImportAll.mockRejectedValueOnce(new Error("zip invalid"));
    render(<WelcomeScreen onDone={vi.fn()} />);

    const file = new File(["bad"], "backup.json", { type: "application/json" });
    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("zip invalid");
    });
  });
});
