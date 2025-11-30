/**
 * Tipi per autenticazione
 * Condivisi tra web e mobile
 */

/**
 * Richiesta login
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Risposta login dal backend
 */
export interface LoginResponse {
  code: number;
  data: {
    email: string;
    nomeCognome: string;
    ruolo: string;
    token: string;
    username: string;
    expiresIn: number;
  };
  message?: string;
}

/**
 * Utente autenticato
 */
export interface User {
  email: string;
  nomeCognome: string;
  ruolo: string;
  username: string;
}

/**
 * Dati di autenticazione salvati
 */
export interface AuthData {
  token: string;
  user: User;
  expiresAt?: number;
}

/**
 * Ruoli utente
 */
export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MASTER: "master",
  CONSULENTE: "consulente",
  BACK_OFFICE: "backoffice"
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Normalizza il ruolo in input (gestisce variazioni di case, underscore, ecc.)
 */
export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;

  const normalized = role.toLowerCase().trim().replace(/[-_\s]/g, '');

  switch (normalized) {
    case "superadmin":
    case "super":
    case "sa":
    case "s":
      return ROLES.SUPERADMIN;
    case "admin":
    case "administrator":
    case "a":
      return ROLES.ADMIN;
    case "master":
    case "m":
      return ROLES.MASTER;
    case "consulente":
    case "consultant":
    case "c":
      return ROLES.CONSULENTE;
    case "backoffice":
    case "back":
    case "b":
      return ROLES.BACK_OFFICE;
    default:
      return null;
  }
}

/**
 * Verifica se un ruolo è SuperAdmin
 */
export function isSuperAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  return normalized === ROLES.SUPERADMIN;
}

/**
 * Verifica se un ruolo è valido
 */
export function isValidRole(role: string | null): role is UserRole {
  if (!role) return false;
  return Object.values(ROLES).includes(role as UserRole);
}

/**
 * Restituisce una descrizione human-readable del ruolo
 */
export function getRoleDisplayName(role: UserRole | null): string {
  switch (role) {
    case ROLES.SUPERADMIN:
      return "Superadmin";
    case ROLES.ADMIN:
      return "Amministratore";
    case ROLES.MASTER:
      return "Master";
    case ROLES.CONSULENTE:
      return "Consulente";
    case ROLES.BACK_OFFICE:
      return "Back Office";
    default:
      return "Utente";
  }
}

/**
 * Restituisce il path della dashboard corretta per un dato ruolo
 */
export function getDashboardPathByRole(role: UserRole | null): string {
  switch (role) {
    case ROLES.SUPERADMIN:
      return "/sa/dashboard";
    case ROLES.ADMIN:
      return "/admin/dashboard";
    case ROLES.MASTER:
    case ROLES.CONSULENTE:
      return "/dashboard";
    case ROLES.BACK_OFFICE:
      return "/backoffice";
    default:
      return "/dashboard";
  }
}
