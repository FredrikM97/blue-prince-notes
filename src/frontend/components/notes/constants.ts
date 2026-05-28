import type { NoteType } from "@/lib/types";

export const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "observation", label: "Observation" },
  { value: "clue", label: "Clue" },
  { value: "code", label: "Code" },
  { value: "theory", label: "Theory" },
  { value: "story", label: "Story" },
];

export const ROOM_NONE_VALUE = "__none__";
