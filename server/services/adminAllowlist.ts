function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase();
}

export function getAdminAllowlist() {
  return (process.env.VELORA_ADMIN_ALLOWLIST ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean);
}

export function isAdminAllowlisted(identity: { email?: string | null; username?: string | null }) {
  const allowlist = getAdminAllowlist();
  if (!allowlist.length) return false;
  const email = normalize(identity.email);
  const username = normalize(identity.username);
  return (email.length > 0 && allowlist.includes(email)) || (username.length > 0 && allowlist.includes(username));
}

export function shouldBootstrapAdmin(identity: { email?: string | null; username?: string | null }) {
  return isAdminAllowlisted(identity);
}
