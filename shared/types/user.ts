/**
 * Tipi per utenti e user-info
 * Allineato con OpenAPI spec
 */

/**
 * Utente semplificato (UserSimpleDto)
 */
export interface UserSimpleDto {
  id: number;
  nomeCognome: string;
  email: string;
  ruolo: string;
}

/**
 * Gestore assegnato all'utente
 */
export interface GestoreUtenteDto {
  gestoreDettaglioId: number;
  gestoreId: number;
  gestoreNome: string;
  gestoreCategoria?: string;
  logoUrl?: string | null;
  dal: string;
  al?: string | null;
  stato: number;
}

/**
 * Agenzia
 */
export interface AgenziaDto {
  id: number;
  ragioneSociale: string;
  piva?: string;
  ibanAddebito?: string;
  indirizzo?: string;
  mail?: string;
  telefono?: string;
  sdi?: string;
  stato?: number;
}

/**
 * Profilo configurazione
 */
export interface ProfiloDto {
  id: number;
  idAgenzia: number;
  ruolo: string;
  jsonMenu?: any;
  jsonHome?: any;
}

/**
 * Risposta completa user-info API
 * Include utente, agenzia, profilo e gestori abilitati
 */
export interface UserInfoResponse {
  id: number;
  username: string;
  nomeCognome: string;
  email: string;
  telefono?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  ruolo: string;
  stato: number;
  notePersonale?: string;
  twoFactor?: boolean;
  iban?: string;
  agenzia?: AgenziaDto;
  profilo?: ProfiloDto;
  gestoriAbilitati?: GestoreUtenteDto[];
}

/**
 * Utente completo (per ADMIN/SUPERADMIN)
 */
export interface UserDto {
  id: number;
  username: string;
  nomeCognome: string;
  email: string;
  telefono?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  ruolo: string;
  idAgenzia?: number;
  stato?: number;
  notePersonale?: string;
  twoFactor?: boolean;
  iban?: string;
}

/**
 * Richiesta creazione utente
 */
export interface CreateUserRequest {
  username: string;
  password: string;
  nomeCognome: string;
  email: string;
  telefono?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  ruolo: string;
  idAgenzia: number;
  stato?: boolean;
  notePersonale?: string;
  twoFactor?: boolean;
  iban?: string;
}

/**
 * Richiesta aggiornamento utente
 */
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  nomeCognome?: string;
  email?: string;
  telefono?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  ruolo?: string;
  idAgenzia?: number;
  stato?: number;
  notePersonale?: string;
  twoFactor?: boolean;
  iban?: string;
}

/**
 * Richiesta cambio password
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Query params per lista utenti
 */
export interface UsersQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  id?: number;
  username?: string;
  nomeCognome?: string;
  email?: string;
  ruolo?: string;
  idAgenzia?: number;
  stato?: number;
}
