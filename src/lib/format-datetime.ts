import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Formato estable SSR/cliente (evita hydration mismatch de toLocaleString). */
export function formatDateTime(value: string | Date) {
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es });
}
