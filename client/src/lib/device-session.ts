const STORAGE_KEY = "velora-device-session-id";

export function getVeloraDeviceSessionId(storage: Storage = localStorage) {
  const current = storage.getItem(STORAGE_KEY);
  if (current) return current;
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? `ses_${crypto.randomUUID()}` : `ses_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  storage.setItem(STORAGE_KEY, id);
  return id;
}

export function resetVeloraDeviceSession(storage: Storage = localStorage) {
  storage.removeItem(STORAGE_KEY);
}
