import type { NoteType, RunScope } from "@/lib/types";

const TYPE_MAP: Record<string, NoteType> = {
  clue: "clue",
  code: "code",
  obs: "observation",
  observation: "observation",
  theory: "theory",
  story: "story",
  book: "story",
  task: "task",
  todo: "task",
};

export interface ParsedCapture {
  title: string;
  type: NoteType;
  isTodo: boolean;
  room?: string;
  tags: string[];
  date?: string;
  status: "open" | "solved";
  scope: RunScope;
  priority?: "low" | "med" | "high";
}

/**
 * Quick-capture syntax:
 *   #tag                → adds tag
 *   room:Parlor / @Parlor → sets room
 *   !clue !code !todo (!task also works) !theory !book !observation
 *   high / med / low    → priority (todos)
 *   cross / cross-run   → scope cross-run
 *   ? (suffix)          → status open question (default open anyway)
 *   done:               → status solved
 */
export function parseCapture(input: string): ParsedCapture {
  const normalizeTokenValue = (value: string) =>
    value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  const tags: string[] = [];
  let type: NoteType = "clue";
  let isTodo = false;
  let room: string | undefined;
  let date: string | undefined;
  let status: "open" | "solved" = "open";
  let scope: RunScope = "cross-run";
  let priority: "low" | "med" | "high" | undefined;

  let rest = input.trim();

  if (/^done:/i.test(rest)) {
    status = "solved";
    rest = rest.replace(/^done:\s*/i, "");
  }

  const tokens = rest.split(/\s+/);
  const titleParts: string[] = [];

  for (const tok of tokens) {
    if (!tok) continue;
    if (tok.startsWith("#") && tok.length > 1) {
      const tag = normalizeTokenValue(tok.slice(1)).toLowerCase();
      if (tag) tags.push(tag);
    } else if (tok.startsWith("!") && tok.length > 1) {
      const key = tok.slice(1).toLowerCase();
      if (key === "todo" || key === "task") {
        isTodo = true;
        type = "task";
      } else if (TYPE_MAP[key]) {
        type = TYPE_MAP[key];
      }
    } else if (/^room:/i.test(tok)) {
      const parsedRoom = normalizeTokenValue(tok.slice(5));
      if (parsedRoom) room = parsedRoom;
    } else if (tok.startsWith("@") && tok.length > 1) {
      const parsedRoom = normalizeTokenValue(tok.slice(1));
      if (parsedRoom) room = parsedRoom;
    } else if (/^>\d{4}-\d{2}-\d{2}$/.test(tok)) {
      date = tok.slice(1);
    } else if (/^(high|med|medium|low)$/i.test(tok)) {
      const p = tok.toLowerCase();
      priority = p === "medium" ? "med" : (p as "low" | "med" | "high");
    } else if (/^(cross|cross-run)$/i.test(tok)) {
      scope = "cross-run";
    } else if (/^this-?run$/i.test(tok)) {
      scope = "this-run";
    } else {
      titleParts.push(tok);
    }
  }

  return {
    title: titleParts.join(" ").trim() || "Untitled",
    type,
    isTodo,
    room,
    tags,
    date,
    status,
    scope,
    priority,
  };
}
