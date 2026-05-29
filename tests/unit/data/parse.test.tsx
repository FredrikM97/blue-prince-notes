import { describe, expect, it } from "vitest";
import { parseCapture } from "@/data/parse";

describe("parseCapture", () => {
  it("parses tags, room, date, type and title", () => {
    const result = parseCapture("!code #door #cipher room:Parlor >2026-05-28 Hidden panel");

    expect(result).toEqual({
      title: "Hidden panel",
      type: "code",
      isTodo: false,
      room: "Parlor",
      tags: ["door", "cipher"],
      date: "2026-05-28",
      status: "open",
      scope: "cross-run",
      priority: undefined,
    });
  });

  it("handles done prefix, todo/task aliases, priority and this-run scope", () => {
    const result = parseCapture("done: !todo medium this-run #urgent Find key");

    expect(result).toEqual({
      title: "Find key",
      type: "task",
      isTodo: true,
      room: undefined,
      tags: ["urgent"],
      date: undefined,
      status: "solved",
      scope: "this-run",
      priority: "med",
    });
  });

  it("falls back to Untitled when no title tokens remain", () => {
    const result = parseCapture("!clue #tag @Entrance_Hall cross-run");

    expect(result.title).toBe("Untitled");
    expect(result.room).toBe("Entrance Hall");
    expect(result.scope).toBe("cross-run");
  });

  it("maps !book to story and normalizes low priority", () => {
    const result = parseCapture("!book low The red journal");

    expect(result.type).toBe("story");
    expect(result.priority).toBe("low");
    expect(result.title).toBe("The red journal");
  });

  it("parses room from room: token with underscores", () => {
    const result = parseCapture("room:West_Wing_Hall !theory hidden mechanism");

    expect(result.room).toBe("West Wing Hall");
    expect(result.type).toBe("theory");
    expect(result.title).toBe("hidden mechanism");
  });

  it("supports hyphen tokens for spaced room and tag names", () => {
    const result = parseCapture("!todo #power-room @entrance-hall Check lock");

    expect(result.room).toBe("entrance hall");
    expect(result.tags).toEqual(["power room"]);
    expect(result.type).toBe("task");
    expect(result.isTodo).toBe(true);
    expect(result.title).toBe("Check lock");
  });
});
