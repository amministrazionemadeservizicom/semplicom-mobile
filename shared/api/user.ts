/**
 * API per utenti e user-info
 * Allineato con OpenAPI spec
 */

import { authed } from './client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types/common';
import type {
  UserInfoResponse,
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UsersQueryParams,
} from '../types/user';

/**
 * Recupera le informazioni complete dell'utente autenticato
 * Include agenzia, profilo e gestori abilitati
 */
export async function getUserInfo(): Promise<UserInfoResponse> {
  console.log('👤 Fetching user info...');

  const response = await authed.get<ApiResponse<UserInfoResponse>>(API_ENDPOINTS.USER_INFO);

  if (response.code !== 0) {
    throw new Error(response.message || 'Errore nel recupero delle informazioni utente');
  }

  console.log('✅ User info retrieved:', {
    id: response.data.id,
    username: response.data.username,
    email: response.data.email,
    ruolo: response.data.ruolo,
    agenzia: response.data.agenzia?.ragioneSociale,
    gestoriCount: response.data.gestoriAbilitati?.length || 0,
  });

  return response.data;
}

/**
 * Cambia la password dell'utente autenticato
 */
export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  console.log('🔐 Changing password...');

  const response = await authed.patch<ApiResponse<null>>(API_ENDPOINTS.CHANGE_PASSWORD, request);

  if (response.code !== 0) {
    throw new Error(response.message || 'Errore nel cambio password');
  }

  console.log('✅ Password changed successfully');
}

/**
 * Lista utenti (ADMIN/SUPERADMIN)
 */
export async function getUsers(params?: UsersQueryParams): Promise<ApiResponse<{ content: UserDto[]; totalElements: number; totalPages: number }>> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_ENDPOINTS.USERS}?${queryParams.toString()}`;
  return authed.get(url);
}

/**
 * Recupera un utente per ID (ADMIN/SUPERADMIN)
 */
export async function getUserById(id: number): Promise<UserDto> {
  const response = await authed.get<ApiResponse<UserDto>>(API_ENDPOINTS.USER_DETAIL(id));

  if (response.code !== 0) {
    throw new Error(response.message || 'Utente non trovato');
  }

  return response.data;
}

/**
 * Crea un nuovo utente (ADMIN/SUPERADMIN)
 */
export async function createUser(request: CreateUserRequest): Promise<UserDto> {
  const response = await authed.post<ApiResponse<UserDto>>(API_ENDPOINTS.USER_CREATE, request);

  if (response.code !== 0) {
    throw new Error(response.message || 'Errore nella creazione utente');
  }

  return response.data;
}

/**
 * Aggiorna un utente (ADMIN/SUPERADMIN)
 */
export async function updateUser(id: number, request: UpdateUserRequest): Promise<UserDto> {
  const response = await authed.put<ApiResponse<UserDto>>(API_ENDPOINTS.USER_UPDATE(id), request);

  if (response.code !== 0) {
    throw new Error(response.message || 'Errore nell\'aggiornamento utente');
  }

  return response.data;
}

/**
 * Elimina un utente (ADMIN/SUPERADMIN)
 */
export async function deleteUser(id: number): Promise<void> {
  const response = await authed.delete<ApiResponse<null>>(API_ENDPOINTS.USER_DELETE(id));

  if (response.code !== 0) {
    throw new Error(response.message || 'Errore nell\'eliminazione utente');
  }
}

/**
 * Toggle stato utente attivo/disattivo (ADMIN/SUPERADMIN)
 */
export async function toggleUserStatus(id: number): Promise<void> {
  const response = await authed.patch<ApiResponse<null>>(API_ENDPOINTS.USER_TOGGLE_STATUS(id));

  if (response.code !== 0) {
    throw new Error(response.message || 'Errore nel cambio stato utente');
  }
}
