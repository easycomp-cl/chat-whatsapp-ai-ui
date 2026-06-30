import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export function getInitials(name: string | null | undefined, phone?: string) {
  if (name?.trim()) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return phone?.slice(-2) ?? "?";
}

const avatarColors = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

export function getAvatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + hash * 31;
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function formatChatTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ayer";
  return format(d, "dd/MM/yy", { locale: es });
}

export function formatFullTime(date: string) {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: es });
}
