/**
 * Dev utility: seeds the store with chunked test notes to verify graph layout.
 * Rooms are organised into 6 "wings" with heavy internal cross-referencing and
 * only 1-2 bridges between wings — this should produce visible cluster groups.
 * Wipe with Settings → Start Fresh when done.
 */
import { nanoid } from "nanoid";
import type { Note, NoteType, RunScope } from "@/lib/types";

// Each wing has a set of rooms, shared tags, and occasional bridge rooms that
// link it to another wing.
const WINGS: Array<{
  rooms: string[];
  tags: string[];
  types: NoteType[];
  bridge?: string; // one room in another wing to occasionally mention
}> = [
  {
    rooms: ["Kitchen", "Scullery", "Butler Pantry", "Laundry", "Coal Cellar", "Storage Room"],
    tags: ["servants", "supplies", "cooking", "fire"],
    types: ["observation", "clue"],
    bridge: "Cellar",
  },
  {
    rooms: ["Library", "Study", "Map Room", "Drawing Room", "Sitting Room", "Reading Nook"],
    tags: ["books", "knowledge", "papers", "hidden"],
    types: ["clue", "theory"],
    bridge: "Observatory",
  },
  {
    rooms: ["Armory", "Guard Room", "Barracks", "Trophy Room", "Dungeon", "Prison"],
    tags: ["weapons", "locked", "guards", "trap", "key"],
    types: ["clue", "observation"],
    bridge: "Underground Vault",
  },
  {
    rooms: ["Ballroom", "Music Room", "Gallery", "Portrait Gallery", "Great Hall", "Foyer"],
    tags: ["music", "art", "social", "portrait", "light"],
    types: ["story", "observation"],
    bridge: "Drawing Room",
  },
  {
    rooms: ["Observatory", "Laboratory", "Clock Room", "Workshop", "Bell Tower", "Attic"],
    tags: ["mechanism", "science", "clock", "hidden", "key"],
    types: ["theory", "code"],
    bridge: "Map Room",
  },
  {
    rooms: [
      "Chapel",
      "Crypt",
      "Antechamber",
      "Throne Room",
      "Hall of Mirrors",
      "Underground Vault",
      "Cellar",
    ],
    tags: ["sacred", "mystery", "ritual", "shadow", "passage"],
    types: ["theory", "story", "clue"],
    bridge: "Prison",
  },
];

const SCOPES: RunScope[] = ["this-run", "cross-run"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function toRef(room: string) {
  return "@" + room.toLowerCase().replace(/\s+/g, "-");
}

export function buildGraphTestNotes(): Note[] {
  const notes: Note[] = [];
  const now = Date.now();

  for (const wing of WINGS) {
    for (const room of wing.rooms) {
      const count = 2 + Math.floor(Math.random() * 3); // 2-4 notes per room
      for (let i = 0; i < count; i++) {
        const type = pick(wing.types);
        const tags = sample(wing.tags, 1 + Math.floor(Math.random() * 2));

        // Mostly reference rooms in the same wing; rarely bridge to another wing
        const internalRef = Math.random() > 0.3 ? pick(wing.rooms.filter((r) => r !== room)) : null;
        const bridgeRef = wing.bridge && Math.random() > 0.8 ? wing.bridge : null;

        const body = [
          internalRef ? `Connected to ${toRef(internalRef)}.` : "",
          bridgeRef ? `Possible link to ${toRef(bridgeRef)}.` : "",
          "Needs further investigation.",
        ]
          .filter(Boolean)
          .join(" ");

        notes.push({
          id: nanoid(),
          type,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${room} ${i + 1}`,
          body,
          room,
          tags,
          status: Math.random() > 0.7 ? "solved" : "open",
          scope: pick(SCOPES),
          imageIds: [],
          createdAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
      }
    }
  }

  return notes;
}
