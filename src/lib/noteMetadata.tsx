import type { NoteType } from "@/lib/types";
import { BookOpen, Eye, Key, Lightbulb, ListTodo, Sparkles } from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components -- shared metadata constants, not a React component module
export const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "observation", label: "Observation" },
  { value: "clue", label: "Clue" },
  { value: "code", label: "Code" },
  { value: "theory", label: "Theory" },
  { value: "story", label: "Story" },
];

export const TYPE_ICON = {
  clue: Lightbulb,
  code: Key,
  observation: Eye,
  theory: Sparkles,
  story: BookOpen,
  task: ListTodo,
} as const;

export const TYPE_LABEL = {
  clue: "Clue",
  code: "Code",
  observation: "Observation",
  theory: "Theory",
  story: "Story",
  task: "Todo",
} as const;

/**
 * Formats a timestamp into a short relative string for note rows.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared utility used by row summaries
export function relTime(ts: number) {
  const delta = Date.now() - ts;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  return `${Math.floor(delta / 86_400_000)}d`;
}
