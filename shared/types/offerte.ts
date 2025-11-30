/**
 * Tipi per il sistema Offerte
 * Condivisi tra web e mobile
 */

// ===== ENUMS =====
export type Categoria = "energia" | "telco" | "fotovoltaico" | "altro";
export type Customer = "privato" | "business" | "condominio";
export type StatoOfferta = "attiva" | "bozza" | "disattiva" | "scaduta";

/**
 * Allegato offerta
 */
export interface AllegatoOfferta {
  idAllegato: number;
  riferimento: string;
}

/**
 * Allegato DTO (nuovo formato API)
 */
export interface AllegatoDto {
  id: number;
  nome: string;
  estensione?: string;
  tipo?: string;
  riferimento: string;
  idEsterno: number;
  downloadUrl?: string;
  dataCreazione?: string;
  idUser?: number;
  nomeUtenteCaricamento?: string;
}

/**
 * Base comune a tutte le offerte
 */
export interface OffertaBase {
  id?: number;
  nome: string;
  categoria: Categoria;
  customer?: Customer;
  stato?: StatoOfferta;
  idGestore?: number;
  nomeGestore?: string;
  prodotto?: string;
  codiceProdotto?: string;
  dal?: string;
  al?: string;
  note?: string;
  bonus?: string;
}

/**
 * Blocco specifico Energia (luce/gas)
 */
export interface OffertaEnergiaDto {
  commodity?: "luce" | "gas";
  acquisition?: "switch" | "switch_con_voltura" | "subentro" | "prima_attivazione";
  acquisizioni?: string[];
  prezzoTipo?: boolean; // true=fisso, false=indicizzato
  prezzo?: number;
  spread?: number;
  indice?: string;
  ccvMonthlyEur?: number;
  abilitaBollettino?: boolean;
  abilitaRidThirdParty?: boolean;
  bollettaCartacea?: boolean;
  periodoFatturazione?: "mensile" | "bimestrale";
}

/**
 * Blocco specifico Telco
 */
export interface OffertaTelcoDto {
  tecnologia?: "FTTH" | "FTTC" | "FWA";
  tecnologie?: string[];
  prezzo?: number;
  attivazione?: number;
  nuovaLinea?: boolean;
  portabilita?: boolean;
  contenutiTv?: boolean;
  noteTv?: string;
  lineaMobile?: boolean;
  noteMobile?: string;
  telefonici?: boolean;
  noteTelefonici?: string;
  periodoFatturazione?: "mensile" | "bimestrale";
  abilitaBollettino?: boolean;
  abilitaRidThirdParty?: boolean;
  bollettaCartacea?: boolean;
}

/**
 * Blocco specifico Fotovoltaico
 */
export interface OffertaFotovoltaicoDto {
  plantKw: number;
  batteria?: boolean;
  batteryKwh?: number;
  trifase?: boolean;
  prezzo?: number;
  noteExtra?: string;
}

/**
 * Gestore
 */
export interface Gestore {
  id?: number;
  nome?: string;
  logoUrl?: string;
}

/**
 * Offerta completa (dettaglio con blocco specifico)
 */
export interface OffertaCompleta {
  id?: number;
  base?: OffertaBase;
  energia?: OffertaEnergiaDto | null;
  telco?: OffertaTelcoDto | null;
  fotovoltaico?: OffertaFotovoltaicoDto | null;
  allegati?: AllegatoDto[];
  nomeOfferta?: string;
  gestore?: Gestore;
  tipoOfferta?: "fisso" | "indicizzato";
  categoria?: "Luce" | "Gas" | "Telco" | "Fotovoltaico";
  note?: string;
  tipoCliente?: "Privati" | "Business" | "Condominio";
  prodotto?: string;
  idPianoCompenso?: number;
  nomePianoCompenso?: string;
}

/**
 * Query params per lista offerte
 */
export interface OffertaQueryParams {
  categoria?: string;
  stato?: string;
  customer?: string;
  idGestore?: number;
  nomeGestore?: string;
  agenziaId?: number;
  userId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/**
 * Controlla se offerta è scaduta
 */
export function isOffertaExpired(dataScadenza?: string): boolean {
  if (!dataScadenza) return false;

  const scadenza = new Date(dataScadenza);
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  return scadenza < oggi;
}

/**
 * Mapping taglie FV (UI) -> kW (API)
 */
export const FV_TAGLIE_MAP = {
  S: { min: 0, max: 3, label: "S (0-3 kW)" },
  M: { min: 3.1, max: 6, label: "M (3-6 kW)" },
  L: { min: 6.1, max: 10, label: "L (6-10 kW)" },
  XL: { min: 10.1, max: 999, label: "XL (10+ kW)" },
} as const;

export type FVTaglia = keyof typeof FV_TAGLIE_MAP;

/**
 * Converti kW -> taglia UI
 */
export function kwToTaglia(kw: number): FVTaglia {
  if (kw <= 3) return "S";
  if (kw <= 6) return "M";
  if (kw <= 10) return "L";
  return "XL";
}
