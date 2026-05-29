import { describe, expect, it } from "vitest";
import { buildUniqueFileName } from "../../src/data/imageNames";

describe("buildUniqueFileName", () => {
  it("keeps unique candidate names", () => {
    const fileName = buildUniqueFileName(["note.png"], "evidence.png", "image", "png");
    expect(fileName).toBe("evidence.png");
  });

  it("adds numeric suffix for duplicates", () => {
    const fileName = buildUniqueFileName(
      ["evidence.png", "evidence (2).png", "evidence (3).png"],
      "evidence.png",
      "image",
      "png",
    );
    expect(fileName).toBe("evidence (4).png");
  });

  it("sanitizes slash characters in candidate", () => {
    const fileName = buildUniqueFileName([], "folder/snap\\shot.png", "image", "png");
    expect(fileName).toBe("folder-snap-shot.png");
  });

  it("builds from fallback when candidate is missing", () => {
    const fileName = buildUniqueFileName([], undefined, "capture", "jpg");
    expect(fileName).toMatch(/^capture-\d+\.jpg$/);
  });

  it("uses png when fallback extension is empty or only dots", () => {
    const fileName = buildUniqueFileName([], undefined, "capture", "...");
    expect(fileName).toMatch(/^capture-\d+\.png$/);
  });

  it("keeps names without extension and appends duplicate suffix", () => {
    const fileName = buildUniqueFileName(["evidence", "evidence (2)"], "evidence", "image", "png");
    expect(fileName).toBe("evidence (3)");
  });
});
