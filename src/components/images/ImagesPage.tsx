import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { useStore } from "@/data/store";
import { PageLayout } from "@/components/common/PageLayout";
import { StoredImageView } from "@/components/StoredImageView";
import { ImagesLeftPanel } from "@/components/images/ImagesLeftPanel";
import { ImagesRightPanel } from "@/components/images/ImagesRightPanel";
import type { Note, StoredImage } from "@/lib/types";
import { toast } from "sonner";
import {
  isSteamImportSupported,
  loadSteamImportStatus,
  pickAndImportSteamFiles,
} from "@/data/steamImport";

function getImageLabel(img: StoredImage): string {
  return img.caption?.trim() || img.name;
}

export function ImagesPage() {
  const images = useStore((s) => s.images);
  const notes = useStore((s) => s.notes);
  const addImage = useStore((s) => s.addImage);
  const removeImage = useStore((s) => s.removeImage);
  const updateImage = useStore((s) => s.updateImage);
  const search = useStore((s) => s.search);
  const deferredSearch = useDeferredValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const steamImportActive = isSteamImportSupported();
  const [steamLastRefreshAt, setSteamLastRefreshAt] = useState<number | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);

  useEffect(() => {
    void loadSteamImportStatus().then((s) => setSteamLastRefreshAt(s.lastRefreshAt));
  }, []);

  async function handleRefreshSteamImages() {
    setRefreshBusy(true);
    try {
      const result = await pickAndImportSteamFiles(addImage);
      if (result === null) return; // user cancelled
      setSteamLastRefreshAt(Date.now());
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} screenshot${result.imported === 1 ? "" : "s"}`);
      } else {
        toast.success("No new Steam screenshots found");
      }
    } catch {
      toast.error("Could not import Steam screenshots");
    } finally {
      setRefreshBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return images;
    return images.filter((i) => `${i.name} ${getImageLabel(i)}`.toLowerCase().includes(q));
  }, [images, deferredSearch]);

  const selectedIndex = useMemo(
    () => filtered.findIndex((img) => img.id === selectedId),
    [filtered, selectedId],
  );
  const selected = useMemo(() => {
    if (selectedIndex >= 0) return filtered[selectedIndex];
    return filtered[0] ?? null;
  }, [filtered, selectedIndex]);

  const relatedNotes = useMemo(
    () => (selected ? notes.filter((note) => note.imageIds.includes(selected.id)) : []),
    [notes, selected],
  );

  const selectByOffset = useCallback(
    (offset: number) => {
      if (filtered.length === 0) return;
      if (selectedIndex < 0) {
        setSelectedId(filtered[0].id);
        return;
      }
      const next = (selectedIndex + offset + filtered.length) % filtered.length;
      setSelectedId(filtered[next].id);
    },
    [filtered, selectedIndex],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && /input|textarea|select|button/i.test(target.tagName);
      if (typing) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectByOffset(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        selectByOffset(1);
      } else if (e.key === "Enter") {
        if (!selected) return;
        e.preventDefault();
        setPreviewOpen(true);
      } else if (e.key === "Escape") {
        setPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, selectByOffset]);

  return (
    <PageLayout
      leftSidebar={
        <ImagesLeftPanel
          total={filtered.length}
          steamImportActive={steamImportActive}
          steamLastRefreshAt={steamLastRefreshAt}
          refreshBusy={refreshBusy}
          onRefreshSteam={handleRefreshSteamImages}
        />
      }
      middle={
        filtered.length === 0 ? (
          <EmptyState>
            No images yet. Add one from note capture or from a note&apos;s editor.
          </EmptyState>
        ) : (
          <div className="images-grid">
            {filtered.map((img) => (
              <ImageThumb
                key={img.id}
                img={img}
                selected={img.id === selectedId}
                onClick={() => setSelectedId(img.id)}
              />
            ))}
          </div>
        )
      }
      rightSidebar={
        <ImagesRightPanel
          img={selected}
          relatedNotes={relatedNotes}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          onPrev={() => selectByOffset(-1)}
          onNext={() => selectByOffset(1)}
          onDelete={async () => {
            if (!selected) return;
            await removeImage(selected.id);
            if (filtered.length <= 1) {
              setSelectedId(null);
              return;
            }
            selectByOffset(1);
          }}
          onSaveLabel={async (label) => {
            if (!selected) return;
            const next = label.trim() || selected.name;
            if (next === getImageLabel(selected)) return;
            await updateImage({ ...selected, caption: next });
            toast.success("Image label updated");
          }}
        />
      }
    >
      {/* middle content is provided via the `middle` prop */}
    </PageLayout>
  );
}

function ImageThumb({
  img,
  selected,
  onClick,
}: {
  img: StoredImage;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group images-thumb ${selected ? "images-thumb-selected" : ""}`}
    >
      <StoredImageView id={img.id} alt={img.name} className="images-thumb-image" />
      <div className="images-thumb-overlay">
        <div className="images-thumb-name">{getImageLabel(img)}</div>
      </div>
    </button>
  );
}
