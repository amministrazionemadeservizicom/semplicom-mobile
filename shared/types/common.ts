/**
 * Tipi comuni condivisi tra web e mobile
 * Nessuna dipendenza DOM/React
 */

/**
 * Risposta paginata standard del backend
 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

/**
 * Wrapper standard risposta API backend
 */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

/**
 * Errore API
 */
export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

/**
 * Sorting direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Base query params per liste paginate
 */
export interface BaseQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SortDirection;
}
