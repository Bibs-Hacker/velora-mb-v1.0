import { describe, expect, it } from "vitest";
import { getAdminAllowlist, isAdminAllowlisted } from "./adminAllowlist";

describe("protected Velora administrator allowlist", () => {
  it("reads the configured secret without exposing its value", () => {
    const allowlist = getAdminAllowlist();
    const firstConfiguredIdentity = allowlist[0];
    if (firstConfiguredIdentity) {
      expect(isAdminAllowlisted({ email: firstConfiguredIdentity })).toBe(true);
    } else {
      expect(allowlist).toEqual([]);
      expect(isAdminAllowlisted({ email: "unconfigured@example.com" })).toBe(false);
    }
  });

  it("does not grant a role from partial or missing identity matches", () => {
    expect(isAdminAllowlisted({ email: "", username: "" })).toBe(false);
    expect(isAdminAllowlisted({ email: "admin@example.com.invalid", username: "not-admin" })).toBe(false);
  });
});
