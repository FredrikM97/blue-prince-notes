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
  // Rooms 001-012
  { name: "The Foundation", category: "Rooms 001-012" },
  { name: "Entrance Hall", category: "Rooms 001-012" },
  { name: "Spare Room", category: "Rooms 001-012" },
  { name: "Rotunda", category: "Rooms 001-012" },
  { name: "Parlor", category: "Rooms 001-012" },
  { name: "Billiard Room", category: "Rooms 001-012" },
  { name: "Gallery", category: "Rooms 001-012" },
  { name: "Room 8", category: "Rooms 001-012" },
  { name: "Closet", category: "Rooms 001-012" },
  { name: "Walk-in Closet", category: "Rooms 001-012" },
  { name: "Attic", category: "Rooms 001-012" },
  { name: "Storeroom", category: "Rooms 001-012" },

  // Rooms 013-024
  { name: "Nook", category: "Rooms 013-024" },
  { name: "Garage", category: "Rooms 013-024" },
  { name: "Music Room", category: "Rooms 013-024" },
  { name: "Locker Room", category: "Rooms 013-024" },
  { name: "Den", category: "Rooms 013-024" },
  { name: "Wine Cellar", category: "Rooms 013-024" },
  { name: "Trophy Room", category: "Rooms 013-024" },
  { name: "Ballroom", category: "Rooms 013-024" },
  { name: "Pantry", category: "Rooms 013-024" },
  { name: "Rumpus Room", category: "Rooms 013-024" },
  { name: "Vault", category: "Rooms 013-024" },
  { name: "Office", category: "Rooms 013-024" },

  // Rooms 025-036
  { name: "Drawing Room", category: "Rooms 025-036" },
  { name: "Study", category: "Rooms 025-036" },
  { name: "Library", category: "Rooms 025-036" },
  { name: "Chamber of Mirrors", category: "Rooms 025-036" },
  { name: "The Pool", category: "Rooms 025-036" },
  { name: "Drafting Studio", category: "Rooms 025-036" },
  { name: "Utility Closet", category: "Rooms 025-036" },
  { name: "Boiler Room", category: "Rooms 025-036" },
  { name: "Pump Room", category: "Rooms 025-036" },
  { name: "Security", category: "Rooms 025-036" },
  { name: "Workshop", category: "Rooms 025-036" },
  { name: "Laboratory", category: "Rooms 025-036" },

  // Rooms 037-046
  { name: "Sauna", category: "Rooms 037-046" },
  { name: "Coat Check", category: "Rooms 037-046" },
  { name: "Mail Room", category: "Rooms 037-046" },
  { name: "Freezer", category: "Rooms 037-046" },
  { name: "Dining Room", category: "Rooms 037-046" },
  { name: "Observatory", category: "Rooms 037-046" },
  { name: "Conference Room", category: "Rooms 037-046" },
  { name: "Aquarium", category: "Rooms 037-046" },
  { name: "Antechamber", category: "Rooms 037-046" },
  { name: "Room 46", category: "Rooms 037-046" },

  // Bedrooms
  { name: "Bedroom", category: "Bedrooms" },
  { name: "Boudoir", category: "Bedrooms" },
  { name: "Guest Bedroom", category: "Bedrooms" },
  { name: "Nursery", category: "Bedrooms" },
  { name: "Servant's Quarters", category: "Bedrooms" },
  { name: "Bunk Room", category: "Bedrooms" },
  { name: "Her Ladyship's Chamber", category: "Bedrooms" },
  { name: "Master Bedroom", category: "Bedrooms" },

  // Hallways
  { name: "Hallway", category: "Hallways" },
  { name: "West Wing Hall", category: "Hallways" },
  { name: "East Wing Hall", category: "Hallways" },
  { name: "Corridor", category: "Hallways" },
  { name: "Passageway", category: "Hallways" },
  { name: "Secret Passage", category: "Hallways" },
  { name: "Foyer", category: "Hallways" },
  { name: "Great Hall", category: "Hallways" },

  // Green Rooms
  { name: "Terrace", category: "Green Rooms" },
  { name: "Patio", category: "Green Rooms" },
  { name: "Courtyard", category: "Green Rooms" },
  { name: "Cloister", category: "Green Rooms" },
  { name: "Veranda", category: "Green Rooms" },
  { name: "Greenhouse", category: "Green Rooms" },
  { name: "Morning Room", category: "Green Rooms" },
  { name: "Secret Garden", category: "Green Rooms" },

  // Shops
  { name: "Commissary", category: "Shops" },
  { name: "Kitchen", category: "Shops" },
  { name: "Locksmith", category: "Shops" },
  { name: "Showroom", category: "Shops" },
  { name: "Laundry Room", category: "Shops" },
  { name: "Bookshop", category: "Shops" },
  { name: "The Armory", category: "Shops" },
  { name: "Mount Holly Gift Shop", category: "Shops" },

  // Red Rooms
  { name: "Lavatory", category: "Red Rooms" },
  { name: "Chapel", category: "Red Rooms" },
  { name: "Maid's Chamber", category: "Red Rooms" },
  { name: "Archives", category: "Red Rooms" },
  { name: "Gymnasium", category: "Red Rooms" },
  { name: "Darkroom", category: "Red Rooms" },
  { name: "Weight Room", category: "Red Rooms" },
  { name: "Furnace", category: "Red Rooms" },

  // Secret Rooms (combined from Studio Additions, Found Floorplans, and Outer Rooms)
  { name: "Dovecote", category: "Secret Rooms" },
  { name: "The Kennel", category: "Secret Rooms" },
  { name: "Clock Tower", category: "Secret Rooms" },
  { name: "Classroom", category: "Secret Rooms" },
  { name: "Solarium", category: "Secret Rooms" },
  { name: "Dormitory", category: "Secret Rooms" },
  { name: "Vestibule", category: "Secret Rooms" },
  { name: "Casino", category: "Secret Rooms" },
  { name: "Planetarium", category: "Secret Rooms" },
  { name: "Mechanarium", category: "Secret Rooms" },
  { name: "Treasure Trove", category: "Secret Rooms" },
  { name: "Throne Room", category: "Secret Rooms" },
  { name: "Tunnel", category: "Secret Rooms" },
  { name: "Conservatory", category: "Secret Rooms" },
  { name: "Lost & Found", category: "Secret Rooms" },
  { name: "Closed Exhibit", category: "Secret Rooms" },
  { name: "Throne of the Blue Prince", category: "Secret Rooms" },
  { name: "Toolshed", category: "Secret Rooms" },
  { name: "Shelter", category: "Secret Rooms" },
  { name: "Schoolhouse", category: "Secret Rooms" },
  { name: "Shrine", category: "Secret Rooms" },
  { name: "Root Cellar", category: "Secret Rooms" },
  { name: "Hovel", category: "Secret Rooms" },
  { name: "Trading Post", category: "Secret Rooms" },
  { name: "Tomb", category: "Secret Rooms" },
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
      acc[group] = rooms.filter((room) => room.category === group);
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
