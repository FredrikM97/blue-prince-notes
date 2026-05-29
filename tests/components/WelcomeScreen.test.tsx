import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeScreen } from "../../src/components/WelcomeScreen";

const mockStore = {
  load: vi.fn(async () => {}),
  startFresh: vi.fn(async () => {}),
};

const mockImportAll = vi.fn(async () => {});
const mockPickSyncFolder = vi.fn(async () => null);
const mockReadFromSyncFolder = vi.fn(async () => null);
const mockImportSyncManifest = vi.fn(async () => {});
const mockGetActiveSyncFolderName = vi.fn(() => null as string | null);
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("../../src/data/store", () => ({
  useStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

vi.mock("../../src/data/io", () => ({
  importAll: (...args: unknown[]) => mockImportAll(...args),
}));

vi.mock("../../src/data/sync", () => ({
  pickSyncFolder: () => mockPickSyncFolder(),
  readFromSyncFolder: (...args: unknown[]) => mockReadFromSyncFolder(...args),
  importSyncManifest: (...args: unknown[]) => mockImportSyncManifest(...args),
  getActiveSyncFolderName: () => mockGetActiveSyncFolderName(),
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
    mockImportAll.mockClear();
    mockPickSyncFolder.mockClear();
    mockReadFromSyncFolder.mockClear();
    mockImportSyncManifest.mockClear();
    mockGetActiveSyncFolderName.mockClear();
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
    mockPickSyncFolder.mockResolvedValueOnce({ name: "SyncDir" });
    mockReadFromSyncFolder.mockResolvedValueOnce({
      manifest: { app: "blue-prince-notes" },
      images: [],
    });

    render(<WelcomeScreen onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Sync folder/i }));

    await waitFor(() => {
      expect(mockImportSyncManifest).toHaveBeenCalled();
      expect(mockStore.load).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith('Loaded data from "SyncDir"');
      expect(onDone).toHaveBeenCalledWith("SyncDir");
    });
  });

  it("connects folder without existing manifest", async () => {
    const onDone = vi.fn();
    mockPickSyncFolder.mockResolvedValueOnce({ name: "SyncDir" });
    mockReadFromSyncFolder.mockResolvedValueOnce(null);
    mockGetActiveSyncFolderName.mockReturnValueOnce("ActiveFolder");

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
    mockPickSyncFolder.mockRejectedValueOnce(new Error("Sensitive system files"));
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
      expect(mockImportAll).toHaveBeenCalledWith(file, "replace");
      expect(mockStore.load).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith("Data imported");
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("handles import error message", async () => {
    mockImportAll.mockRejectedValueOnce(new Error("zip invalid"));
    render(<WelcomeScreen onDone={vi.fn()} />);

    const file = new File(["bad"], "backup.json", { type: "application/json" });
    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("zip invalid");
    });
  });
});
