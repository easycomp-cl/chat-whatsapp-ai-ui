import {
  formatFullDateTime,
  formatShortDate,
  formatTime,
  isTodayInAppTimezone,
  isYesterdayInAppTimezone,
} from "@/lib/format-datetime";
import { getAvatarInitials } from "@/lib/text/grapheme";

export function getInitials(name: string | null | undefined, phone?: string) {
  return getAvatarInitials(name, phone);
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
  if (isTodayInAppTimezone(d)) return formatTime(d);
  if (isYesterdayInAppTimezone(d)) return "Ayer";
  return formatShortDate(d);
}

export function formatFullTime(date: string) {
  return formatFullDateTime(date);
}
