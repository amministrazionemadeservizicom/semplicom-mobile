/**
 * Context per gestione autenticazione
 * Usa getUserInfo API per recuperare dati utente completi
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  loginApi,
  logoutApi,
  saveAuthData,
  getStoredToken,
  isAuthenticated as checkAuth,
  clearAuthData,
} from '../shared/api/auth';
import { getUserInfo } from '../shared/api/user';
import {
  normalizeRole,
  getDashboardPathByRole,
  hasRole,
  can,
  type UserRole,
  ROLES,
} from '../shared/utils/roles';
import type { LoginRequest } from '../shared/types/auth';
import type { UserInfoResponse, AgenziaDto, GestoreUtenteDto } from '../shared/types/user';

// ============ TYPES ============

/**
 * User esteso con tutti i dati da user-info API
 */
export interface AuthUser {
  id: number;
  username: string;
  nomeCognome: string;
  email: string;
  telefono?: string;
  ruolo: string;
  agenzia?: AgenziaDto;
  gestoriAbilitati?: GestoreUtenteDto[];
}

interface AuthContextType {
  // State
  user: AuthUser | null;
  token: string | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;

  // Role helpers
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  can: (permission: string) => boolean;
  getDashboardPath: () => string;
}

// ============ CONTEXT ============
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ PROVIDER ============
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const userRole = normalizeRole(user?.ruolo);
  const isAuthenticated = !!user && !!token;
  const isSuperAdmin = userRole === ROLES.SUPERADMIN;
  const isAdmin = userRole === ROLES.ADMIN;

  // ============ FETCH USER INFO ============
  const fetchUserInfo = async (): Promise<AuthUser | null> => {
    try {
      console.log('📡 Fetching user info from API...');
      const userInfo = await getUserInfo();

      const authUser: AuthUser = {
        id: userInfo.id,
        username: userInfo.username,
        nomeCognome: userInfo.nomeCognome,
        email: userInfo.email,
        telefono: userInfo.telefono,
        ruolo: userInfo.ruolo,
        agenzia: userInfo.agenzia,
        gestoriAbilitati: userInfo.gestoriAbilitati,
      };

      console.log('✅ User info loaded:', {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        ruolo: authUser.ruolo,
        agenzia: authUser.agenzia?.ragioneSociale,
      });

      return authUser;
    } catch (err) {
      console.error('❌ Error fetching user info:', err);
      return null;
    }
  };

  // ============ REFRESH USER INFO ============
  const refreshUserInfo = useCallback(async () => {
    if (!token) return;

    try {
      const userInfo = await fetchUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (err) {
      console.error('Error refreshing user info:', err);
    }
  }, [token]);

  // ============ CHECK AUTH STATUS ============
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authenticated = await checkAuth();
      const storedToken = await getStoredToken();

      if (authenticated && storedToken) {
        setToken(storedToken);

        // Fetch fresh user info from API
        const userInfo = await fetchUserInfo();
        if (userInfo) {
          setUser(userInfo);
        } else {
          // Se non riusciamo a ottenere i dati utente, clear auth
          console.warn('⚠️ Could not fetch user info, clearing auth');
          await clearAuthData();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Check auth error:', err);
      setUser(null);
      setToken(null);
      setError('Errore verifica autenticazione');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // ============ LOGIN ============
  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginApi(credentials);

      if (response.code === 0 && response.data) {
        // Salva token
        await saveAuthData(
          response.data.token,
          {
            email: response.data.email,
            nomeCognome: response.data.nomeCognome,
            ruolo: response.data.ruolo,
            username: response.data.username,
          },
          credentials.rememberMe || false,
          response.data.expiresIn
        );

        setToken(response.data.token);

        // Ora fetch user info completo dall'API
        const userInfo = await fetchUserInfo();
        if (userInfo) {
          setUser(userInfo);
        } else {
          // Fallback: usa i dati dalla risposta login
          setUser({
            id: 0, // Non disponibile dal login
            username: response.data.username,
            nomeCognome: response.data.nomeCognome,
            email: response.data.email,
            ruolo: response.data.ruolo,
          });
        }
      } else if (response.code === 1) {
        // 2FA required
        throw new Error('Autenticazione a due fattori richiesta');
      } else {
        throw new Error(response.message || 'Login fallito');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Errore di login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============ LOGOUT ============
  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ ROLE HELPERS ============
  const hasRoleCheck = (roles: UserRole | UserRole[]) => {
    return hasRole(user?.ruolo, roles);
  };

  const canCheck = (permission: string) => {
    return can(user?.ruolo, permission);
  };

  const getDashboardPath = () => {
    return getDashboardPathByRole(user?.ruolo);
  };

  // ============ CONTEXT VALUE ============
  const value: AuthContextType = {
    // State
    user,
    token,
    userRole,
    isLoading,
    isAuthenticated,
    error,

    // Actions
    login,
    logout,
    checkAuthStatus,
    refreshUserInfo,

    // Role helpers
    isSuperAdmin,
    isAdmin,
    hasRole: hasRoleCheck,
    can: canCheck,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============ HOOK ============
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export for convenience
export { ROLES, type UserRole };

// Re-export utility functions
export { normalizeRole, getDashboardPathByRole, hasRole, can } from '../shared/utils/roles';

// Helper function to get role display name
export function getRoleDisplayName(role: UserRole | string | null): string {
  if (!role) return 'Utente';
  switch (role) {
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
      return 'Utente';
  }
}
