import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Registers a global `paste` event listener that extracts image files from
 * the clipboard and forwards them to `onImages`. Uses a ref so the latest
 * callback is always invoked without needing to re-register the listener.
 */
export function usePasteImages({
  onImages,
  enabled = true,
}: {
  onImages: (files: File[]) => void;
  enabled?: boolean;
}) {
  const onImagesRef = useRef(onImages);
  // Update the ref after each render so the event handler always calls the latest version.
  useLayoutEffect(() => {
    onImagesRef.current = onImages;
  });

  useEffect(() => {
    if (!enabled) return;

    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) files.push(file);
      }
      if (files.length > 0) onImagesRef.current(files);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enabled]);
}
