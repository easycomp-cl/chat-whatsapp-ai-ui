import type { Profile, UserRole } from "@/types/database.types";

export function canManageFaqs(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageKnowledge(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageAgents(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageSettings(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canToggleBot(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canClearConversationChat(role: UserRole) {
  return role === "BUSINESS_ADMIN";
}

export function canChangeConversationMode(profile: Profile) {
  return (
    profile.role === "BUSINESS_ADMIN" ||
    profile.role === "AGENT" ||
    profile.role === "SUPER_ADMIN"
  );
}

export function isSuperAdmin(role: UserRole) {
  return role === "SUPER_ADMIN";
}

export function isAgent(role: UserRole) {
  return role === "AGENT";
}
