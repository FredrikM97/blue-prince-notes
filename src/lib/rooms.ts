// Blue Prince — Mt. Holly rooms, grouped by category so the dropdown is browseable.
// Users can still place any room anywhere on their 5×9 map grid manually.

export type RoomCategory =
  | "Entrance & Halls"
  | "Living & Lounging"
  | "Bedrooms & Private"
  | "Kitchen & Service"
  | "Library & Study"
  | "Recreation"
  | "Workshop & Utility"
  | "Garden & Outside"
  | "Secret & Special";

export interface RoomDef {
  name: string;
  category: RoomCategory;
}

export const DEFAULT_ROOMS: RoomDef[] = [
  // Entrance & Halls
  { name: "Entrance Hall", category: "Entrance & Halls" },
  { name: "Foyer", category: "Entrance & Halls" },
  { name: "Hallway", category: "Entrance & Halls" },
  { name: "Antechamber", category: "Entrance & Halls" },
  { name: "Coat Check", category: "Entrance & Halls" },

  // Living & Lounging
  { name: "Parlor", category: "Living & Lounging" },
  { name: "Den", category: "Living & Lounging" },
  { name: "Drawing Room", category: "Living & Lounging" },
  { name: "Tearoom", category: "Living & Lounging" },
  { name: "Nook", category: "Living & Lounging" },
  { name: "Solarium", category: "Living & Lounging" },

  // Bedrooms & Private
  { name: "Bedroom", category: "Bedrooms & Private" },
  { name: "Boudoir", category: "Bedrooms & Private" },
  { name: "Closet", category: "Bedrooms & Private" },
  { name: "Bathroom", category: "Bedrooms & Private" },
  { name: "Lavatory", category: "Bedrooms & Private" },
  { name: "Locker Room", category: "Bedrooms & Private" },

  // Kitchen & Service
  { name: "Kitchen", category: "Kitchen & Service" },
  { name: "Dining Room", category: "Kitchen & Service" },
  { name: "Pantry", category: "Kitchen & Service" },
  { name: "Wine Cellar", category: "Kitchen & Service" },
  { name: "Storeroom", category: "Kitchen & Service" },

  // Library & Study
  { name: "Library", category: "Library & Study" },
  { name: "Office", category: "Library & Study" },
  { name: "Studio", category: "Library & Study" },
  { name: "Gallery", category: "Library & Study" },

  // Recreation
  { name: "Billiard Room", category: "Recreation" },
  { name: "Music Room", category: "Recreation" },
  { name: "Trophy Room", category: "Recreation" },
  { name: "Aquarium", category: "Recreation" },
  { name: "Chapel", category: "Recreation" },
  { name: "Observatory", category: "Recreation" },

  // Workshop & Utility
  { name: "Workshop", category: "Workshop & Utility" },
  { name: "Garage", category: "Workshop & Utility" },
  { name: "Laboratory", category: "Workshop & Utility" },
  { name: "Darkroom", category: "Workshop & Utility" },
  { name: "Pump Room", category: "Workshop & Utility" },

  // Garden & Outside
  { name: "Conservatory", category: "Garden & Outside" },
  { name: "Greenhouse", category: "Garden & Outside" },
  { name: "Courtyard", category: "Garden & Outside" },
  { name: "Maze", category: "Garden & Outside" },
  { name: "Secret Garden", category: "Garden & Outside" },

  // Secret & Special
  { name: "Vault", category: "Secret & Special" },
  { name: "Tomb", category: "Secret & Special" },
  { name: "Rotunda", category: "Secret & Special" },
  { name: "Mt. Holly", category: "Secret & Special" },
];

export const ROOM_CATEGORIES: RoomCategory[] = [
  "Entrance & Halls",
  "Living & Lounging",
  "Bedrooms & Private",
  "Kitchen & Service",
  "Library & Study",
  "Recreation",
  "Workshop & Utility",
  "Garden & Outside",
  "Secret & Special",
];

export type RoomStatus = "unknown" | "drafted" | "explored" | "cleared";

// Mt. Holly map grid dimensions.
export const GRID_COLS = 5;
export const GRID_ROWS = 9;

export function cellId(row: number, col: number) {
  return `${row},${col}`;
}
