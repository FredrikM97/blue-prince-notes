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

  it("deduplicates and normalizes rooms on replace", () => {
    const next = replaceCustomRooms([
      { name: "  Puzzle Room  ", category: "Secret Rooms" },
      { name: "puzzle   room", category: "Secret Rooms" },
      { name: "Ignored", category: "not-a-group" as never },
    ]);

    expect(next).toEqual([{ name: "puzzle room", category: "Secret Rooms", custom: true }]);
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
