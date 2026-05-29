export function buildUniqueFileName(
  existingNames: Iterable<string>,
  candidate?: string,
  fallbackBase = "image",
  fallbackExt = "png",
): string {
  const safeExt = fallbackExt.trim().replace(/^\.+/, "") || "png";
  const raw =
    (candidate?.trim() || `${fallbackBase}-${Date.now()}.${safeExt}`).replace(/[/\\]/g, "-") ||
    `${fallbackBase}-${Date.now()}.${safeExt}`;

  const dotIndex = raw.lastIndexOf(".");
  const hasExt = dotIndex > 0 && dotIndex < raw.length - 1;
  const base = hasExt ? raw.slice(0, dotIndex) : raw;
  const ext = hasExt ? raw.slice(dotIndex) : "";

  const used = new Set(Array.from(existingNames, (name) => name.toLowerCase()));
  let next = raw;
  let i = 2;
  while (used.has(next.toLowerCase())) {
    next = `${base} (${i})${ext}`;
    i += 1;
  }
  return next;
}
