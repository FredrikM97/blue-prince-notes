// Blue Prince room catalog, grouped by user-requested buckets.

export type RoomGroup =
  | "Rooms 001-012"
  | "Rooms 013-024"
  | "Rooms 025-036"
  | "Rooms 037-046"
  | "Bedrooms"
  | "Hallways"
  | "Green Rooms"
  | "Shops"
  | "Red Rooms"
  | "Secret Rooms";

// Backward-compatible alias used by older components.
export type RoomCategory = RoomGroup;

export interface RoomDef {
  name: string;
  category: RoomCategory;
  custom?: boolean;
}

const CUSTOM_ROOMS_STORAGE_KEY = "bp-custom-rooms-v1";

export const ROOM_GROUPS: RoomGroup[] = [
  "Rooms 001-012",
  "Rooms 013-024",
  "Rooms 025-036",
  "Rooms 037-046",
  "Bedrooms",
  "Hallways",
  "Green Rooms",
  "Shops",
  "Red Rooms",
  "Secret Rooms",
];

const DEFAULT_ROOMS: RoomDef[] = [
  { name: "Antechamber", category: "Rooms 001-012" },
  { name: "Aquarium", category: "Rooms 001-012" },
  { name: "Billiard Room", category: "Rooms 001-012" },
  { name: "Boudoir", category: "Rooms 001-012" },
  { name: "Chapel", category: "Rooms 001-012" },
  { name: "Closet", category: "Rooms 001-012" },
  { name: "Coat Check", category: "Rooms 001-012" },
  { name: "Conservatory", category: "Rooms 001-012" },
  { name: "Courtyard", category: "Rooms 001-012" },
  { name: "Darkroom", category: "Rooms 001-012" },
  { name: "Den", category: "Rooms 001-012" },
  { name: "Dining Room", category: "Rooms 001-012" },

  { name: "Drawing Room", category: "Rooms 013-024" },
  { name: "Entrance Hall", category: "Rooms 013-024" },
  { name: "Foyer", category: "Rooms 013-024" },
  { name: "Gallery", category: "Rooms 013-024" },
  { name: "Garage", category: "Rooms 013-024" },
  { name: "Greenhouse", category: "Rooms 013-024" },
  { name: "Hallway", category: "Rooms 013-024" },
  { name: "Kitchen", category: "Rooms 013-024" },
  { name: "Laboratory", category: "Rooms 013-024" },
  { name: "Lavatory", category: "Rooms 013-024" },
  { name: "Library", category: "Rooms 013-024" },
  { name: "Locker Room", category: "Rooms 013-024" },

  { name: "Maze", category: "Rooms 025-036" },
  { name: "Music Room", category: "Rooms 025-036" },
  { name: "Nook", category: "Rooms 025-036" },
  { name: "Observatory", category: "Rooms 025-036" },
  { name: "Office", category: "Rooms 025-036" },
  { name: "Pantry", category: "Rooms 025-036" },
  { name: "Parlor", category: "Rooms 025-036" },
  { name: "Pump Room", category: "Rooms 025-036" },
  { name: "Rotunda", category: "Rooms 025-036" },
  { name: "Secret Garden", category: "Rooms 025-036" },
  { name: "Solarium", category: "Rooms 025-036" },
  { name: "Storeroom", category: "Rooms 025-036" },

  { name: "Studio", category: "Rooms 037-046" },
  { name: "Tearoom", category: "Rooms 037-046" },
  { name: "Tomb", category: "Rooms 037-046" },
  { name: "Trophy Room", category: "Rooms 037-046" },
  { name: "Vault", category: "Rooms 037-046" },
  { name: "Wine Cellar", category: "Rooms 037-046" },
  { name: "Workshop", category: "Rooms 037-046" },
  { name: "Bathroom", category: "Rooms 037-046" },
  { name: "Bedroom", category: "Rooms 037-046" },
  { name: "Mt. Holly", category: "Rooms 037-046" },
];

function normalizeRoomName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listCustomRooms(): RoomDef[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_ROOMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ name: string; category: RoomCategory }>;
    return parsed
      .map((room) => ({
        name: normalizeRoomName(room.name),
        category: room.category,
        custom: true,
      }))
      .filter((room) => room.name.length > 0 && ROOM_GROUPS.includes(room.category));
  } catch {
    return [];
  }
}

export function replaceCustomRooms(rooms: Array<{ name: string; category: RoomCategory }>) {
  const normalized = rooms
    .map((room) => ({
      name: normalizeRoomName(room.name),
      category: room.category,
      custom: true,
    }))
    .filter((room) => room.name.length > 0 && ROOM_GROUPS.includes(room.category));

  const byName = new Map<string, RoomDef>();
  for (const room of normalized) {
    byName.set(room.name.toLowerCase(), room);
  }
  const deduped = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));

  writeCustomRooms(deduped);
  return deduped;
}

function writeCustomRooms(rooms: RoomDef[]) {
  if (!canUseStorage()) return;
  const serializable = rooms.map((room) => ({ name: room.name, category: room.category }));
  window.localStorage.setItem(CUSTOM_ROOMS_STORAGE_KEY, JSON.stringify(serializable));
}

export function addCustomRoom(name: string, category: RoomCategory) {
  const normalized = normalizeRoomName(name);
  if (!normalized) return listCustomRooms();

  const current = listCustomRooms();
  const exists = current.some((room) => room.name.toLowerCase() === normalized.toLowerCase());
  if (exists) return current;

  const next = [...current, { name: normalized, category, custom: true }];
  writeCustomRooms(next);
  return next;
}

export function removeCustomRoom(name: string) {
  const normalized = normalizeRoomName(name).toLowerCase();
  const next = listCustomRooms().filter((room) => room.name.toLowerCase() !== normalized);
  writeCustomRooms(next);
  return next;
}

export function getRoomCatalog() {
  return [...DEFAULT_ROOMS, ...listCustomRooms()];
}

function groupRoomsByCategory(rooms: RoomDef[]) {
  return ROOM_GROUPS.reduce(
    (acc, group) => {
      acc[group] = rooms
        .filter((room) => room.category === group)
        .sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    },
    {} as Record<RoomCategory, RoomDef[]>,
  );
}

export function getGroupedRoomCatalog() {
  return groupRoomsByCategory(getRoomCatalog());
}

// Mt. Holly map grid dimensions.
export const GRID_COLS = 5;
export const GRID_ROWS = 9;

export function cellId(row: number, col: number) {
  return `${row},${col}`;
}
