import { describe, expect, it } from "vitest";
import { extractHashtags, extractMentions, normalizeUsername, sanitizePlainText } from "./platform";

describe("Velora shared platform rules", () => {
  it("normalizes profile handles without modifying permitted characters", () => {
    expect(normalizeUsername("  Ada.Lovelace_42 ")).toBe("ada.lovelace_42");
  });

  it("removes control characters and bounds plain text", () => {
    expect(sanitizePlainText("hello\u0000\n  world", 50)).toBe("hello world");
    expect(sanitizePlainText("abcdef", 4)).toBe("abcd");
  });

  it("extracts unique hashtags and mentions for social discovery", () => {
    expect(extractHashtags("#Velora #velora #fresh.start")).toEqual(["velora", "fresh"]);
    expect(extractMentions("Hello @Ada.Lovelace and @ada.lovelace")).toEqual(["ada.lovelace"]);
  });
});
