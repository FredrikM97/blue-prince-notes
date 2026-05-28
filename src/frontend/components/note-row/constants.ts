import { Key, BookOpen, Lightbulb, Eye, Sparkles, ListTodo } from "lucide-react";

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
  observation: "Obs.",
  theory: "Theory",
  story: "Story",
  task: "Todo",
} as const;

export function relTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}
