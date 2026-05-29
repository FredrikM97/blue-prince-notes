/**
 * SuggestionsDropdown — self-contained token suggestion system.
 *
 * Default export: SuggestionsDropdown wrapper component.
 * Wraps any <InputField> or <DetailsField> and overlays a dismissible suggestion list.
 * Reads the field value + cursor atomically from the child's onChange event (React's
 * onChange on inputs bubbles), so no value/onChange props are needed on this wrapper.
 * Writes suggestions back via the native DOM setter trick so controlled inputs update normally.
 *
 * Usage:
 *   <SuggestionsDropdown>
 *     <InputField label="Title" value={text} onChange={setText} />
 *   </SuggestionsDropdown>
 *
 *   <SuggestionsDropdown onSubmitShortcut={handleSave}>
 *     <InputField ... />
 *   </SuggestionsDropdown>
 *
 * Pure token-parsing helpers are also exported for unit testing:
 *   getActiveToken, buildSuggestions, applySuggestionToValue
 */

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSuggestionSources } from "@/hooks/useSuggestionSources";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TokenSuggestion {
  value: string;
  /** Short label shown beside the suggestion value (e.g. "room", "tag"). */
  hint: string;
}

interface ActiveToken {
  token: string;
  /** Inclusive index where the token starts in the string. */
  start: number;
  /** Exclusive index where the token ends in the string. */
  end: number;
}

// ── Token parsing (pure, exported for testing) ─────────────────────────────────

function isWhitespace(char: string | undefined) {
  return !char || /\s/.test(char);
}

function normalizeTokenValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

/** Returns the full word token at the current cursor position and its string bounds. */
export function getActiveToken(value: string, cursorPos: number): ActiveToken {
  const pos = Math.max(0, Math.min(cursorPos, value.length));

  let tokenStart = pos;
  while (tokenStart > 0 && !isWhitespace(value[tokenStart - 1])) tokenStart -= 1;

  let tokenEnd = pos;
  while (tokenEnd < value.length && !isWhitespace(value[tokenEnd])) tokenEnd += 1;

  return { token: value.slice(tokenStart, tokenEnd), start: tokenStart, end: tokenEnd };
}

// ── Per-token suggestion helpers ──────────────────────────────────────────────

function suggestRooms(token: string, rooms: string[]): TokenSuggestion[] {
  const q = token.startsWith("@")
    ? normalizeTokenValue(token.slice(1))
    : normalizeTokenValue(token.slice(5)); // "room:" prefix
  const out: TokenSuggestion[] = [];
  for (const room of rooms) {
    if (!normalizeTokenValue(room).includes(q)) continue;
    out.push({ value: `@${room.replace(/\s+/g, "-")}`, hint: "room" });
    if (out.length >= 8) break;
  }
  return out;
}

function suggestTags(token: string, tags: string[]): TokenSuggestion[] {
  const q = normalizeTokenValue(token.slice(1));
  const out: TokenSuggestion[] = [];
  for (const tag of tags) {
    if (!normalizeTokenValue(tag).includes(q)) continue;
    out.push({ value: `#${tag.replace(/\s+/g, "-")}`, hint: "tag" });
    if (out.length >= 8) break;
  }
  return out;
}

function suggestNotes(token: string, noteTitles: string[]): TokenSuggestion[] {
  const q = normalizeTokenValue(token.slice(1));
  const out: TokenSuggestion[] = [];
  for (const title of noteTitles) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug.includes(q)) continue;
    out.push({ value: `^${slug}`, hint: "note" });
    if (out.length >= 8) break;
  }
  return out;
}

const TYPE_COMMANDS = ["!code", "!observation", "!theory", "!story", "!todo"] as const;

function suggestTypes(token: string): TokenSuggestion[] {
  const q = token.toLowerCase();
  return TYPE_COMMANDS
    .filter((cmd) => cmd.includes(q))
    .map((cmd) => ({ value: cmd, hint: "type" }));
}

function suggestDate(): TokenSuggestion[] {
  return [{ value: `>${new Date().toISOString().slice(0, 10)}`, hint: "date" }];
}

/** Returns suggestion candidates for @room, #tag, ^note, !type, >date tokens. Empty array when no token matches. */
export function buildSuggestions(
  activeToken: { token: string },
  rooms: string[],
  tags: string[],
  noteTitles: string[] = [],
): TokenSuggestion[] {
  const { token } = activeToken;
  if (!token) return [];

  if (token.startsWith("@") || /^room:/i.test(token)) return suggestRooms(token, rooms);
  if (token.startsWith("#")) return suggestTags(token, tags);
  if (token.startsWith("^")) return suggestNotes(token, noteTitles);
  if (token.startsWith("!")) return suggestTypes(token);
  if (token.startsWith(">")) return suggestDate();

  return [];
}

/** Splices a chosen suggestion into the value string, replacing the active token. Returns the updated value and next cursor position. */
export function applySuggestionToValue(
  value: string,
  tokenBounds: { start: number; end: number },
  suggestion: string,
) {
  const next =
    `${value.slice(0, tokenBounds.start)}${suggestion} ${value.slice(tokenBounds.end).trimStart()}`.trim();
  return {
    value: next,
    cursor: Math.min(next.length, tokenBounds.start + suggestion.length + 1),
  };
}

// ── Dropdown placement ─────────────────────────────────────────────────────────

/**
 * Creates a temporary mirror element to measure the pixel position of a character
 * in an input or textarea. Used to anchor the dropdown under the token start.
 */
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
    "boxSizing", "fontFamily", "fontSize", "fontStyle", "fontWeight",
    "letterSpacing", "lineHeight", "paddingTop", "paddingRight", "paddingBottom",
    "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth",
    "borderLeftWidth", "textTransform", "textIndent", "textAlign",
    "tabSize", "whiteSpace", "wordBreak",
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

  for (const prop of copiedProperties) mirror.style[prop] = style[prop];

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

/** Computes absolute CSS position for the suggestion dropdown relative to the token start. */
function useDropdownStyle({
  inputRef,
  value,
  tokenStart,
}: {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  tokenStart: number;
}): CSSProperties {
  const isMultiline = inputRef.current instanceof HTMLTextAreaElement;

  const tokenAnchor = useMemo(() => {
    const before = value.slice(0, Math.max(0, Math.min(tokenStart, value.length)));
    const lines = before.split("\n");
    return { line: Math.max(0, lines.length - 1), col: lines.at(-1)?.length ?? 0 };
  }, [tokenStart, value]);

  const tokenAnchorPx = useMemo(
    () => measureTokenAnchorPx(inputRef.current, value, tokenStart),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputRef, tokenStart, value],
  );

  const left = tokenAnchorPx
    ? `clamp(0.5rem, ${tokenAnchorPx.left}px, calc(100% - 14rem))`
    : `clamp(0.5rem, calc(0.75rem + ${tokenAnchor.col}ch), calc(100% - 14rem))`;

  if (!isMultiline) return { left, top: "calc(100% + 0.25rem)" };

  const top = tokenAnchorPx
    ? `clamp(3.5rem, ${tokenAnchorPx.top + tokenAnchorPx.lineHeight + 6}px, calc(100% - 12rem))`
    : `clamp(3.5rem, calc(3.5rem + (${tokenAnchor.line} + 1) * 1.5rem), calc(100% - 12rem))`;

  return { left, top };
}

// ── Suggestion controller ──────────────────────────────────────────────────────

/** Manages suggestion list state and keyboard navigation for a token-aware field. */
function useSuggestionController({
  value,
  setValue,
  cursorPos,
  setCursorPos,
  roomSuggestions,
  tagSuggestions,
  noteTitles,
  onCommitCursor,
}: {
  value: string;
  setValue: (value: string) => void;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  roomSuggestions: string[];
  tagSuggestions: string[];
  noteTitles: string[];
  onCommitCursor?: (cursor: number) => void;
}) {
  const activeToken = useMemo(() => getActiveToken(value, cursorPos), [value, cursorPos]);
  const suggestions = useMemo(
    () => buildSuggestions(activeToken, roomSuggestions, tagSuggestions, noteTitles),
    [activeToken, roomSuggestions, tagSuggestions, noteTitles],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissedForKey, setDismissedForKey] = useState<string | null>(null);

  const suggestionKey = `${activeToken.start}:${activeToken.end}:${activeToken.token}`;
  const boundedIndex = suggestions.length === 0 ? 0 : Math.min(activeIndex, suggestions.length - 1);
  const isOpen = suggestions.length > 0 && dismissedForKey !== suggestionKey;

  function apply(suggestion: TokenSuggestion) {
    const next = applySuggestionToValue(value, activeToken, suggestion.value);
    setValue(next.value);
    setCursorPos(next.cursor);
    onCommitCursor?.(next.cursor);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>): boolean {
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
      apply(picked);
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

  return { suggestions, isOpen, apply, tokenStart: activeToken.start, activeIndex: boundedIndex, setActiveIndex, onKeyDown };
}

// ── Visual list ────────────────────────────────────────────────────────────────

function SuggestionItems({
  suggestions,
  activeIndex,
  onApply,
  onHover,
  isOpen,
  style,
}: {
  suggestions: TokenSuggestion[];
  activeIndex: number;
  onApply: (suggestion: TokenSuggestion) => void;
  onHover: (index: number) => void;
  isOpen: boolean;
  style?: CSSProperties;
}) {
  if (!isOpen || suggestions.length === 0) return null;
  return (
    <div className="capture-suggestion-dropdown" role="listbox" aria-label="Token suggestions" style={style}>
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.value}
          type="button"
          className={`capture-suggestion-item${index === activeIndex ? " capture-suggestion-item-active" : ""}`}
          aria-selected={index === activeIndex}
          onMouseEnter={() => onHover(index)}
          onMouseDown={(e) => {
            e.preventDefault();
            onApply(suggestion);
          }}
        >
          <span>{suggestion.value}</span>
          <span className="capture-suggestion-hint">{suggestion.hint}</span>
        </button>
      ))}
    </div>
  );
}

// ── Wrapper component ──────────────────────────────────────────────────────────

/**
 * Wraps any input or textarea field and adds token suggestions.
 * No data props needed — reads value+cursor from the child's onChange event and
 * writes suggestions back via the native DOM setter so controlled inputs stay in sync.
 *
 * Keyboard shortcuts (active when suggestion list is open):
 *   ↑/↓ — navigate suggestions
 *   Enter / Tab — apply highlighted suggestion
 *   Escape — dismiss suggestions
 *   Cmd/Ctrl+Enter — calls onSubmitShortcut if provided
 */
export function SuggestionsDropdown({
  children,
  onSubmitShortcut,
}: {
  children: ReactNode;
  /** Optional: called with keepOpen=true when Shift is held during Cmd/Ctrl+Enter. */
  onSubmitShortcut?: (keepOpen: boolean) => void;
}) {
  const sharedSuggestions = useSuggestionSources();
  const [localValue, setLocalValue] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const inputElRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  /** Atomically sync both value and cursor from the DOM element. */
  function syncFromEl(target: EventTarget | null) {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      inputElRef.current = target;
      setLocalValue(target.value);
      setCursorPos(target.selectionStart ?? target.value.length);
    }
  }

  /**
   * Apply a suggestion string to the actual DOM input.
   * Uses the native property setter so React's controlled onChange fires normally.
   */
  function writeToInput(nextValue: string) {
    const el = inputElRef.current;
    if (!el) return;
    const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const nativeSet = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    nativeSet?.call(el, nextValue);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    setLocalValue(nextValue);
  }

  const controller = useSuggestionController({
    value: localValue,
    setValue: writeToInput,
    cursorPos,
    setCursorPos,
    roomSuggestions: sharedSuggestions.roomSuggestions,
    tagSuggestions: sharedSuggestions.tagSuggestions,
    noteTitles: sharedSuggestions.noteSuggestions,
    onCommitCursor: (nextCursor) => {
      requestAnimationFrame(() => {
        inputElRef.current?.focus();
        inputElRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    },
  });

  const dropdownStyle = useDropdownStyle({
    inputRef: inputElRef,
    value: localValue,
    tokenStart: controller.tokenStart,
  });

  return (
    <div
      className="capture-suggestion-field"
      onChange={(e) => syncFromEl(e.target)}   // value+cursor in one update → fixes @ lag
      onKeyUp={(e) => syncFromEl(e.target)}     // catches cursor moves (arrow keys)
      onClick={(e) => syncFromEl(e.target)}     // catches click-to-reposition cursor
      onKeyDownCapture={(e) => {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
        inputElRef.current = e.target;
        if (controller.onKeyDown(e)) return;
        if (onSubmitShortcut && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmitShortcut(e.shiftKey);
        }
      }}
    >
      {children}
      <SuggestionItems
        suggestions={controller.suggestions}
        activeIndex={controller.activeIndex}
        onApply={controller.apply}
        onHover={controller.setActiveIndex}
        isOpen={controller.isOpen}
        style={dropdownStyle}
      />
    </div>
  );
}
