const STORAGE_PREFIX = "easycomp:profile-event-actor:";
const TTL_MS = 60_000;

type PendingActor = {
  name: string;
  until: number;
};

function storageKey(conversationId: string): string {
  return `${STORAGE_PREFIX}${conversationId}`;
}

/** Recuerda quién guardó el perfil para etiquetar el globo hasta que el backend mande actor_name. */
export function rememberProfileEventActor(conversationId: string, name: string): void {
  const trimmed = name.trim();
  if (!conversationId || !trimmed || typeof window === "undefined") return;
  const payload: PendingActor = { name: trimmed, until: Date.now() + TTL_MS };
  try {
    window.sessionStorage.setItem(storageKey(conversationId), JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function peekProfileEventActor(conversationId: string): string {
  if (!conversationId || typeof window === "undefined") return "";
  try {
    const raw = window.sessionStorage.getItem(storageKey(conversationId));
    if (!raw) return "";
    const parsed = JSON.parse(raw) as PendingActor;
    if (!parsed?.name || typeof parsed.until !== "number") return "";
    if (Date.now() > parsed.until) {
      window.sessionStorage.removeItem(storageKey(conversationId));
      return "";
    }
    return parsed.name.trim();
  } catch {
    return "";
  }
}

export function isGenericActorName(name: string | null | undefined): boolean {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return true;
  return /^(asesor|bot|sistema|usuario|business_admin|admin)$/i.test(trimmed);
}
