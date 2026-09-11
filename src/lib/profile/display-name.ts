export type ProfileNameFields = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
};

/** Nombre visible: nombre + apellido, o full_name, o fallback. */
export function formatProfileDisplayName(
  profile: ProfileNameFields,
  fallback = "Usuario"
): string {
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  const combined = [first, last].filter(Boolean).join(" ");
  if (combined) return combined;
  const full = profile.full_name?.trim();
  if (full) return full;
  return fallback;
}

export function buildSenderNameByUserId(
  profiles: Array<ProfileNameFields & { user_id: string }>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const profile of profiles) {
    map[profile.user_id] = formatProfileDisplayName(profile);
  }
  return map;
}
