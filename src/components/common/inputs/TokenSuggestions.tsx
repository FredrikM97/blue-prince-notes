export interface TokenSuggestion {
  value: string;
  hint: string;
}

export interface ActiveToken {
  token: string;
  start: number;
  end: number;
}

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

/**
 * Resolves the token currently under the cursor and its source bounds.
 */
export function getActiveToken(value: string, cursorPos: number): ActiveToken {
  const pos = Math.max(0, Math.min(cursorPos, value.length));

  let tokenStart = pos;
  while (tokenStart > 0 && !isWhitespace(value[tokenStart - 1])) {
    tokenStart -= 1;
  }

  let tokenEnd = pos;
  while (tokenEnd < value.length && !isWhitespace(value[tokenEnd])) {
    tokenEnd += 1;
  }

  return {
    token: value.slice(tokenStart, tokenEnd),
    start: tokenStart,
    end: tokenEnd,
  };
}

/**
 * Builds suggestion candidates for @room, #tag, !type, and >date tokens.
 */
export function buildSuggestions(
  activeToken: { token: string },
  rooms: string[],
  tags: string[],
): TokenSuggestion[] {
  const token = activeToken.token;
  if (!token) return [];

  if (token.startsWith("@") || /^room:/i.test(token)) {
    const q = token.startsWith("@")
      ? normalizeTokenValue(token.slice(1))
      : normalizeTokenValue(token.slice(5));
    const suggestions: TokenSuggestion[] = [];
    for (const room of rooms) {
      if (!normalizeTokenValue(room).includes(q)) continue;
      suggestions.push({ value: `@${room.replace(/\s+/g, "-")}`, hint: "room" });
      if (suggestions.length >= 8) break;
    }
    return suggestions;
  }

  if (token.startsWith("#")) {
    const q = normalizeTokenValue(token.slice(1));
    const suggestions: TokenSuggestion[] = [];
    for (const tag of tags) {
      if (!normalizeTokenValue(tag).includes(q)) continue;
      suggestions.push({ value: `#${tag.replace(/\s+/g, "-")}`, hint: "tag" });
      if (suggestions.length >= 8) break;
    }
    return suggestions;
  }

  if (token.startsWith("!")) {
    const typeCommands = ["!clue", "!code", "!observation", "!theory", "!story", "!todo"];
    const q = token.toLowerCase();
    return typeCommands
      .filter((cmd) => cmd.includes(q))
      .map((cmd) => ({ value: cmd, hint: "type" }));
  }

  if (token.startsWith(">")) {
    const today = new Date().toISOString().slice(0, 10);
    return [{ value: `>${today}`, hint: "date" }];
  }

  return [];
}

/**
 * Replaces the current token with a picked suggestion and returns next cursor state.
 */
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
