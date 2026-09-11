import type { UserRole } from "@/types/database.types";

/** Etiquetas visibles en UI (español). */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administrador",
  BUSINESS_ADMIN: "Administrador",
  COLLABORATOR: "Colaborador",
  /** @deprecated Usar COLLABORATOR. Se mantiene hasta migración BD. */
  AGENT: "Colaborador",
};

/** Copy del módulo de gestión de personas del negocio. */
export const TEAM_MODULE = {
  navLabel: "Mi equipo",
  pageTitle: "Mi equipo",
  pageDescription:
    "Personas de tu negocio que atienden conversaciones y reciben notificaciones de derivación",
  memberSingular: "Miembro del equipo",
  memberPlural: "Miembros del equipo",
  createMember: "Agregar miembro",
  editMember: "Editar miembro",
  newMember: "Nuevo miembro",
  memberCreated: "Miembro agregado al equipo",
  memberUpdated: "Miembro actualizado",
  memberSaveError: "Error al guardar miembro",
} as const;

/** Copy del módulo Mis Clientes. */
export const CLIENTS_MODULE = {
  navLabel: "Mis Clientes",
  pageTitle: "Mis Clientes",
  pageDescription: "Contactos de tu negocio agrupados por frecuencia de atención",
  tabFrequent: "Clientes frecuentes",
  tabOthers: "Otros clientes",
} as const;

/** Rol de login con acceso operativo (atiende chats, no configura negocio). */
export const COLLABORATOR_ROLES: UserRole[] = ["COLLABORATOR", "AGENT"];

export function isCollaboratorRole(role: UserRole): boolean {
  return COLLABORATOR_ROLES.includes(role);
}

/**
 * Normaliza rol leído de BD/API.
 * Hoy la BD puede devolver AGENT; en UI tratamos ambos como colaborador.
 */
export function normalizeRoleFromDb(role: UserRole): UserRole {
  return role === "AGENT" ? "COLLABORATOR" : role;
}

/**
 * Rol a persistir en BD hasta que backend migre el enum a COLLABORATOR.
 */
export function normalizeRoleForDb(role: UserRole): UserRole {
  return role === "COLLABORATOR" ? "AGENT" : role;
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[normalizeRoleFromDb(role)];
}

export function roleMatchesNav(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  const normalized = normalizeRoleFromDb(userRole);
  return allowedRoles.some((r) => normalizeRoleFromDb(r) === normalized);
}
