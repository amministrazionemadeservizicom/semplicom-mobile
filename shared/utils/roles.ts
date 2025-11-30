/**
 * Sistema Ruoli e Permessi
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/utils/roles.ts
 */

// ============ RUOLI ============
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MASTER: 'master',
  CONSULENTE: 'consulente',
  BACK_OFFICE: 'backoffice',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// ============ PERMESSI PER RUOLO ============
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [ROLES.SUPERADMIN]: [
    'sa-dashboard',
    'tenant-management',
    'gestori-management',
    'agenzie-management',
    'create-admin',
    'offers-global',
    'users-global',
    'contracts-global',
    'commissions-global',
    'settings-global',
    'dashboard-global',
    'offers-manage',
    'compile-contract',
    'contracts-all',
    'commissions-all',
    'commission-plans-crud',
    'users-crud',
    'documents-upload',
    'settings',
    'profile',
    'admin-offers',
    'processing',
  ],
  [ROLES.ADMIN]: [
    'dashboard-global',
    'offers-manage-agency',
    'compile-contract',
    'contracts-all-agency',
    'commissions-all-agency',
    'commission-plans-crud-agency',
    'users-crud-agency',
    'documents-upload',
    'settings-agency',
    'profile',
    'admin-offers',
    'processing',
    'attendance-manage',
  ],
  [ROLES.MASTER]: [
    'dashboard-team',
    'compile-contract',
    'contracts-team',
    'commissions-team',
    'assign-gestori-team',
    'documents-upload',
    'profile',
    'processing',
  ],
  [ROLES.BACK_OFFICE]: [
    'dashboard-processing',
    'contracts-manage',
    'documents-upload',
    'profile',
    'processing',
    'work-queue',
  ],
  [ROLES.CONSULENTE]: [
    'dashboard-personal',
    'compile-contract',
    'contracts-own',
    'commissions-own',
    'documents-upload',
    'profile',
  ],
};

// ============ NORMALIZZAZIONE RUOLI ============
/**
 * Normalizza il ruolo in input al formato standard
 * Gestisce variazioni di formato dal backend
 */
export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;

  const normalized = role.toLowerCase().trim();

  switch (normalized) {
    case 'superadmin':
    case 'super':
    case 'sa':
    case 's':
      return ROLES.SUPERADMIN;

    case 'admin':
    case 'administrator':
    case 'a':
      return ROLES.ADMIN;

    case 'master':
    case 'm':
      return ROLES.MASTER;

    case 'consulente':
    case 'consultant':
    case 'c':
      return ROLES.CONSULENTE;

    case 'backoffice':
    case 'back_office':
    case 'back':
    case 'b':
      return ROLES.BACK_OFFICE;

    default:
      console.warn(`Ruolo non riconosciuto: ${role}`);
      return null;
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Verifica se il ruolo è SuperAdmin
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLES.SUPERADMIN;
}

/**
 * Verifica se il ruolo è Admin
 */
export function isAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLES.ADMIN;
}

/**
 * Verifica se il ruolo è valido
 */
export function isValidRole(role: string | null | undefined): boolean {
  return normalizeRole(role) !== null;
}

/**
 * Ottiene il display name del ruolo
 */
export function getRoleDisplayName(role: string | null | undefined): string {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case ROLES.SUPERADMIN:
      return 'Super Admin';
    case ROLES.ADMIN:
      return 'Amministratore';
    case ROLES.MASTER:
      return 'Master';
    case ROLES.CONSULENTE:
      return 'Consulente';
    case ROLES.BACK_OFFICE:
      return 'Back Office';
    default:
      return role || 'Sconosciuto';
  }
}

/**
 * Verifica se un ruolo ha un determinato permesso
 */
export function can(
  role: string | null | undefined,
  permission: string
): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(permission);
}

/**
 * Verifica se il ruolo corrente corrisponde a uno dei ruoli richiesti
 */
export function hasRole(
  currentRole: string | null | undefined,
  requiredRoles: UserRole | UserRole[]
): boolean {
  const normalized = normalizeRole(currentRole);
  if (!normalized) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(normalized);
}

/**
 * Ottiene il path dashboard corretto per il ruolo
 */
export function getDashboardPathByRole(role: string | null | undefined): string {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case ROLES.SUPERADMIN:
      return '/sa/dashboard';
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.MASTER:
    case ROLES.CONSULENTE:
      return '/dashboard';
    case ROLES.BACK_OFFICE:
      return '/backoffice';
    default:
      return '/login';
  }
}

// ============ ROUTE ACCESS ============

/**
 * Route pubbliche (accessibili senza autenticazione)
 */
export const PUBLIC_ROUTES = ['/login', '/index', '/'];

/**
 * Route comuni (accessibili a tutti gli utenti autenticati)
 */
export const COMMON_ROUTES = [
  '/contracts',
  '/profile',
  '/messaggi',
  '/simulation',
  '/compile-contract',
  '/comunicazioni',
  '/drive',
  '/home',
  '/offerte',
  '/new-practice',
];

/**
 * Route per ruolo specifico
 */
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  [ROLES.SUPERADMIN]: [
    '/sa/dashboard',
    '/sa/gestione-agenzie',
    '/sa/gestori-config',
    '/sa/users',
    '/sa/offers',
  ],
  [ROLES.ADMIN]: [
    '/admin/dashboard',
    '/admin/gestori-agenzia',
    '/admin/commission-plans',
    '/admin/presenze',
    '/users',
    '/AdminOffers',
    '/stato-pagamenti',
  ],
  [ROLES.MASTER]: ['/dashboard'],
  [ROLES.CONSULENTE]: ['/dashboard'],
  [ROLES.BACK_OFFICE]: ['/backoffice', '/back-office'],
};

/**
 * Verifica se un ruolo può accedere a una route
 */
export function canAccessRoute(
  role: string | null | undefined,
  path: string
): boolean {
  // Route pubbliche sempre accessibili
  if (PUBLIC_ROUTES.includes(path)) return true;

  const normalized = normalizeRole(role);
  if (!normalized) return false;

  // Route comuni accessibili a tutti
  if (COMMON_ROUTES.some((route) => path.startsWith(route))) return true;

  // Route specifiche per ruolo
  const roleRoutes = ROLE_ROUTES[normalized] || [];
  if (roleRoutes.some((route) => path.startsWith(route))) return true;

  // SuperAdmin può accedere a tutto
  if (normalized === ROLES.SUPERADMIN) return true;

  // Admin può accedere a quasi tutto eccetto /sa/*
  if (normalized === ROLES.ADMIN && !path.startsWith('/sa/')) return true;

  return false;
}
