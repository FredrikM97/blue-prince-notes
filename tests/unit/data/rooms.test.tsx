import { beforeEach, describe, expect, it } from "vitest";
import {
  addCustomRoom,
  clearCustomRooms,
  getGroupedRoomCatalog,
  listCustomRooms,
  removeCustomRoom,
  replaceCustomRooms,
  ROOM_GROUPS,
  cellId,
} from "@/data/rooms";

describe("rooms custom catalog", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearCustomRooms();
  });

  it("deduplicates, normalizes, and accepts arbitrary custom groups", () => {
    const next = replaceCustomRooms([
      { name: "  Puzzle Room  ", category: "Secret Rooms" },
      { name: "puzzle   room", category: "Secret Rooms" },
      { name: "Basement", category: "Underground" },
    ]);

    expect(next).toEqual([
      { name: "Basement", category: "Underground", custom: true },
      { name: "puzzle room", category: "Secret Rooms", custom: true },
    ]);
  });

  it("adds unique room case-insensitively and removes by name", () => {
    addCustomRoom("Steam Lab", "Secret Rooms");
    addCustomRoom("steam lab", "Secret Rooms");

    expect(listCustomRooms()).toHaveLength(1);

    const remaining = removeCustomRoom("STEAM LAB");
    expect(remaining).toEqual([]);
  });

  it("keeps grouped catalog shape with all room groups", () => {
    const grouped = getGroupedRoomCatalog();

    expect(Object.keys(grouped)).toEqual(ROOM_GROUPS);
    expect(grouped["Secret Rooms"].length).toBeGreaterThan(0);
  });

  it("builds stable grid cell ids", () => {
    expect(cellId(2, 4)).toBe("2,4");
  });
});
