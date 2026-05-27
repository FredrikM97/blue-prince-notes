import { Key, Book, Lightbulb, Eye, Sparkles, ListTodo } from "lucide-react";

export const TYPE_ICON = {
  clue: Lightbulb,
  code: Key,
  observation: Eye,
  theory: Sparkles,
  book: Book,
  task: ListTodo,
} as const;

export const TYPE_LABEL = {
  clue: "Clue",
  code: "Code",
  observation: "Obs.",
  theory: "Theory",
  book: "Book",
  task: "Todo",
} as const;

export function relTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}
