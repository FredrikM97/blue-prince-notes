import { useEffect, useState } from "react";
import { X } from "lucide-react";

function PendingImageItem({
  blob,
  index,
  onRemove,
}: {
  blob: Blob;
  index: number;
  onRemove: (index: number) => void;
}) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const nextUrl = URL.createObjectURL(blob);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [blob]);

  return (
    <div className="relative h-14 w-14 overflow-hidden rounded border border-border">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        onClick={() => onRemove(index)}
        className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function PendingImageList({
  images,
  onRemove,
}: {
  images: Blob[];
  onRemove: (index: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((blob, index) => (
        <PendingImageItem
          key={`${blob.size}-${index}`}
          blob={blob}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
