import { describe, expect, it } from "vitest";
import { getVeloraDeviceSessionId, resetVeloraDeviceSession } from "./device-session";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } as Storage;
}

describe("Velora device session client utility", () => {
  it("persists a stable device identifier and can reset it", () => {
    const local = storage(); const initial = getVeloraDeviceSessionId(local);
    expect(initial).toMatch(/^ses_/); expect(getVeloraDeviceSessionId(local)).toBe(initial);
    resetVeloraDeviceSession(local); expect(local.getItem("velora-device-session-id")).toBeNull();
  });
});
