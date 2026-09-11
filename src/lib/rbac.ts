import type { Profile, UserRole } from "@/types/database.types";
import { isCollaboratorRole } from "@/lib/roles/labels";

export function canManageFaqs(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageKnowledge(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageTeam(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

/** @deprecated Usar canManageTeam */
export const canManageAgents = canManageTeam;

export function canManageSettings(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canToggleBot(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canClearConversationChat(role: UserRole) {
  return role === "BUSINESS_ADMIN";
}

/** Ver snapshot / texto original cuando el cliente edita o borra en WhatsApp. */
export function canViewCustomerMessageAudit(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}

export function canChangeConversationMode(profile: Profile) {
  return (
    profile.role === "BUSINESS_ADMIN" ||
    isCollaboratorRole(profile.role) ||
    profile.role === "SUPER_ADMIN"
  );
}

export function isSuperAdmin(role: UserRole) {
  return role === "SUPER_ADMIN";
}

export function isCollaborator(role: UserRole) {
  return isCollaboratorRole(role);
}

/** @deprecated Usar isCollaborator */
export const isAgent = isCollaborator;

export function canManageCustomerProfile(role: UserRole) {
  return role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
}
