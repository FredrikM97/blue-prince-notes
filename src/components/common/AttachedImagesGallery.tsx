import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/dialog";
import { IconButton } from "@/components/common/button";
import { StoredImageView } from "@/components/StoredImageView";
import { useStore } from "@/data/store";
import { cn } from "@/lib/utils";

export function AttachedImagesGallery({
  imageIds,
  title = "Images",
  collapsible = false,
  wrapperClassName,
  titleClassName,
  headerClassName,
  gridClassName,
  itemButtonClassName,
  imageClassName,
  labelClassName,
  collapseButtonClassName,
  dialogPreviewClassName,
}: {
  imageIds: string[];
  title?: string;
  collapsible?: boolean;
  wrapperClassName?: string;
  titleClassName?: string;
  headerClassName?: string;
  gridClassName?: string;
  itemButtonClassName?: string;
  imageClassName?: string;
  labelClassName?: string;
  collapseButtonClassName?: string;
  dialogPreviewClassName?: string;
}) {
  const images = useStore((s) => s.images);
  const [zoomedImageId, setZoomedImageId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const imageById = useMemo(() => new Map(images.map((img) => [img.id, img])), [images]);

  if (imageIds.length === 0) return null;

  const getImageLabel = (id: string) => {
    const img = imageById.get(id);
    if (!img) return "Image";
    return img.caption?.trim() || img.name;
  };

  return (
    <section className={cn("note-details-images", wrapperClassName)}>
      <div className={cn("mb-2 flex items-center gap-2", headerClassName)}>
        <div className={cn("note-details-images-label", titleClassName)}>
          {title} ({imageIds.length})
        </div>
        {collapsible && (
          <IconButton
            aria-label={collapsed ? "Expand images" : "Collapse images"}
            title={collapsed ? "Expand images" : "Collapse images"}
            className={cn("h-6 w-6 rounded border border-input", collapseButtonClassName)}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </IconButton>
        )}
      </div>

      {!collapsed && (
        <div className={cn("note-details-images-grid", gridClassName)}>
          {imageIds.map((id) => (
            <button
              key={id}
              type="button"
              className={cn("note-details-image-btn text-left", itemButtonClassName)}
              onClick={() => setZoomedImageId(id)}
              aria-label={`Open image preview: ${getImageLabel(id)}`}
            >
              <StoredImageView
                id={id}
                className={cn("h-28 w-full object-cover", imageClassName)}
                alt={getImageLabel(id)}
              />
              <p className={cn("mt-1 truncate px-1 text-xs text-muted-foreground", labelClassName)}>
                {getImageLabel(id)}
              </p>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!zoomedImageId} onOpenChange={(open) => !open && setZoomedImageId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {zoomedImageId ? getImageLabel(zoomedImageId) : "Image preview"}
            </DialogTitle>
          </DialogHeader>
          <div className={cn("note-details-zoom-preview", dialogPreviewClassName)}>
            {zoomedImageId && (
              <StoredImageView
                id={zoomedImageId}
                className="mx-auto max-h-[70vh] w-full object-contain"
                alt="Enlarged note image"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
