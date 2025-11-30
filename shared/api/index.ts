/**
 * Export di tutte le API condivise
 */

// Client HTTP
export {
  authedFetch,
  authed,
  publicFetch,
  buildUrl,
  initClient,
  getClientConfig,
  type ClientConfig,
} from './client';

// Auth API
export {
  loginApi,
  logoutApi,
  saveAuthData,
  clearAuthData,
  getStoredUser,
  getStoredToken,
  isAuthenticated,
  isTokenExpired,
  refreshTokenApi,
} from './auth';

// User API
export {
  getUserInfo,
  changePassword,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from './user';

// Offerte API
export { offerteApi, OfferteAPI } from './offerte';

// Contratti API
export { contrattiApi, ContrattiAPI } from './contratti';

// Gestori API
export { gestoriApi, GestoriAPI, normalizeCategoria, createSlug } from './gestori';
