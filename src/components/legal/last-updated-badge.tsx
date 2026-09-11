import {
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/constants";

export function LastUpdatedBadge() {
  return (
    <p className="text-sm text-muted-foreground">
      Última actualización:{" "}
      <time dateTime="2026-08-01">{LEGAL_LAST_UPDATED}</time>
      {" · "}Versión {LEGAL_VERSION}
    </p>
  );
}
