import { describe, expect, it } from "vitest";
import {
  applySuggestionToValue,
  buildSuggestions,
  getActiveToken,
} from "@/components/common/dropdown/SuggestionsDropdown";

describe("notes suggestions", () => {
  it("builds room suggestions from @ token", () => {
    const token = getActiveToken("Inspect @entr", 13);
    const suggestions = buildSuggestions(token, ["Entrance Hall", "Parlor"], ["puzzle"]);

    expect(suggestions.map((s) => s.value)).toEqual(["@Entrance-Hall"]);
  });

  it("builds tag suggestions from # token", () => {
    const token = getActiveToken("Need #pow", 9);
    const suggestions = buildSuggestions(token, ["Entrance Hall"], ["power room", "safe"]);

    expect(suggestions.map((s) => s.value)).toEqual(["#power-room"]);
  });

  it("builds type suggestions from ! token", () => {
    const token = getActiveToken("Use !th", 7);
    const suggestions = buildSuggestions(token, ["Parlor"], ["safe"]);

    expect(suggestions.map((s) => s.value)).toEqual(["!theory"]);
  });

  it("applies suggestion into active token bounds", () => {
    const current = "Need @ent clue";
    const token = getActiveToken(current, 9);
    const applied = applySuggestionToValue(current, token, "@Entrance-Hall");

    expect(applied.value).toBe("Need @Entrance-Hall clue");
    expect(applied.cursor).toBe(20);
  });
});
