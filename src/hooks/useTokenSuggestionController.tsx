import { useMemo, useState, type CSSProperties, type RefObject } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  applySuggestionToValue,
  buildSuggestions,
  getActiveToken,
  type TokenSuggestion,
} from "@/components/common/inputs/TokenSuggestions";

export type SuggestionKeydownEvent = ReactKeyboardEvent<HTMLElement>;

function measureTokenAnchorPx(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  anchorPos: number,
) {
  if (!element || typeof document === "undefined") return null;

  const boundedAnchor = Math.max(0, Math.min(anchorPos, value.length));
  const style = window.getComputedStyle(element);
  const mirror = document.createElement("div");

  const copiedProperties = [
    "boxSizing",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "textTransform",
    "textIndent",
    "textAlign",
    "tabSize",
    "whiteSpace",
    "wordBreak",
  ] as const;

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.width = `${element.clientWidth}px`;
  mirror.style.overflow = "hidden";
  mirror.style.whiteSpace = element instanceof HTMLTextAreaElement ? "pre-wrap" : "pre";
  mirror.style.wordBreak = element instanceof HTMLTextAreaElement ? "break-word" : "normal";

  for (const prop of copiedProperties) {
    mirror.style[prop] = style[prop];
  }

  const textBefore = value.slice(0, boundedAnchor);
  mirror.textContent = textBefore.length > 0 ? textBefore : "\u200b";

  const marker = document.createElement("span");
  marker.textContent = value.slice(boundedAnchor, boundedAnchor + 1) || "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const left = element.offsetLeft + marker.offsetLeft - element.scrollLeft;
  const top = element.offsetTop + marker.offsetTop - element.scrollTop;
  const lineHeight = Number.parseFloat(style.lineHeight) || 20;

  document.body.removeChild(mirror);

  return { left, top, lineHeight };
}

/**
 * Builds dropdown placement styles for a token anchor in an input/textarea.
 * Keeps placement concerns separate from suggestion state logic.
 */
export function useTokenSuggestionDropdownStyle({
  inputRef,
  value,
  tokenStart,
}: {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  tokenStart: number;
}) {
  const isMultiline = inputRef.current instanceof HTMLTextAreaElement;
  const tokenAnchor = useMemo(() => {
    const anchorPos = Math.max(0, Math.min(tokenStart, value.length));
    const before = value.slice(0, anchorPos);
    const lines = before.split("\n");
    const line = Math.max(0, lines.length - 1);
    const col = lines[line]?.length ?? 0;
    return { line, col };
  }, [tokenStart, value]);

  const tokenAnchorPx = useMemo(
    () => measureTokenAnchorPx(inputRef.current, value, tokenStart),
    [inputRef, tokenStart, value],
  );

  const left = tokenAnchorPx
    ? `clamp(0.5rem, ${tokenAnchorPx.left}px, calc(100% - 14rem))`
    : `clamp(0.5rem, calc(0.75rem + ${tokenAnchor.col}ch), calc(100% - 14rem))`;

  if (!isMultiline) {
    return { left, top: "calc(100% + 0.25rem)" } satisfies CSSProperties;
  }

  const top = tokenAnchorPx
    ? `clamp(3.5rem, ${tokenAnchorPx.top + tokenAnchorPx.lineHeight + 6}px, calc(100% - 12rem))`
    : `clamp(3.5rem, calc(3.5rem + (${tokenAnchor.line} + 1) * 1.5rem), calc(100% - 12rem))`;

  return { left, top } satisfies CSSProperties;
}

/**
 * Handles token suggestions independently of a specific input element.
 */
export function useTokenSuggestionController({
  value,
  setValue,
  cursorPos,
  setCursorPos,
  roomSuggestions,
  tagSuggestions,
  onCommitCursor,
}: {
  value: string;
  setValue: (value: string) => void;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  roomSuggestions: string[];
  tagSuggestions: string[];
  onCommitCursor?: (cursor: number) => void;
}) {
  const activeToken = useMemo(() => getActiveToken(value, cursorPos), [value, cursorPos]);
  const suggestions = useMemo(
    () => buildSuggestions(activeToken, roomSuggestions, tagSuggestions),
    [activeToken, roomSuggestions, tagSuggestions],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissedForKey, setDismissedForKey] = useState<string | null>(null);

  const suggestionKey = `${activeToken.start}:${activeToken.end}:${activeToken.token}`;
  const boundedIndex =
    suggestions.length === 0 ? 0 : Math.min(activeIndex, Math.max(0, suggestions.length - 1));
  const isOpen = suggestions.length > 0 && dismissedForKey !== suggestionKey;

  function applySuggestion(suggestion: TokenSuggestion) {
    const next = applySuggestionToValue(value, activeToken, suggestion.value);
    setValue(next.value);
    setCursorPos(next.cursor);
    onCommitCursor?.(next.cursor);
  }

  function onKeyDown(event: SuggestionKeydownEvent) {
    if (!isOpen) return false;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return true;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return true;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      const picked = suggestions[boundedIndex];
      if (!picked) return false;
      event.preventDefault();
      setDismissedForKey(null);
      applySuggestion(picked);
      return true;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setActiveIndex(0);
      setDismissedForKey(suggestionKey);
      return true;
    }

    return false;
  }

  return {
    suggestions,
    isOpen,
    applySuggestion,
    tokenStart: activeToken.start,
    activeIndex: boundedIndex,
    setActiveIndex,
    onKeyDown,
  };
}
