import { useMemo, useState, type RefObject } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  applySuggestionToValue,
  buildSuggestions,
  getActiveToken,
  type TokenSuggestion,
} from "@/components/common/inputs/TokenSuggestions";

export type SuggestionKeydownEvent = ReactKeyboardEvent<HTMLElement>;

/**
 * Handles token suggestions for text inputs and textareas, including
 * candidate derivation, keyboard navigation, apply behavior, and anchor position.
 */
export function useTokenSuggestionController<T extends HTMLInputElement | HTMLTextAreaElement>({
  value,
  setValue,
  cursorPos,
  setCursorPos,
  inputRef,
  roomSuggestions,
  tagSuggestions,
}: {
  value: string;
  setValue: (value: string) => void;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  inputRef: RefObject<T | null>;
  roomSuggestions: string[];
  tagSuggestions: string[];
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
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(next.cursor, next.cursor);
    });
  }

  const tokenAnchor = useMemo(() => {
    const before = value.slice(0, cursorPos);
    const lines = before.split("\n");
    const line = Math.max(0, lines.length - 1);
    const col = lines[line]?.length ?? 0;
    return { line, col };
  }, [cursorPos, value]);

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
    tokenAnchor,
    applySuggestion,
    activeIndex: boundedIndex,
    setActiveIndex,
    onKeyDown,
  };
}
