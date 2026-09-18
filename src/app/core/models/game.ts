/**
 * Modelos relacionados con los juegos.
 *
 * Incluye tanto la forma de los datos que devuelve la API de FreeToGame
 * (a traves del proxy) como los subconjuntos que usa la interfaz.
 */

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

export type PlatformFilter = 'pc' | 'browser' | 'all';
export type SortBy = 'relevance' | 'release-date' | 'popularity' | 'alphabetical';

// ---------------------------------------------------------------------------
// Respuestas de la API
// ---------------------------------------------------------------------------

/** Cada juego tal como viene en el listado */
export interface GameListItem {
  id: number;
  title: string;
  thumbnail: string;
  short_description: string;
  game_url: string;
  genre: string;
  platform: string;
  publisher?: string;
  developer?: string;
  release_date?: string;
}

/** Captura de pantalla dentro del detalle de un juego */
export interface GameScreenshot {
  id: number;
  image: string;
}

/** Detalle completo: el listado mas descripcion, capturas y requisitos */
export interface GameDetail extends GameListItem {
  status?: string;
  description?: string;
  freetogame_profile_url?: string;
  screenshots?: GameScreenshot[];
  minimum_system_requirements?: {
    os?: string;
    processor?: string;
    memory?: string;
    graphics?: string;
    storage?: string;
  };
}

/** Respuesta paginada que arma el proxy de Cloudflare */
export interface GameListResponse {
  items: GameListItem[];
  total: number;
}

/** Opciones aceptadas por `GamesApiService.getGames()` */
export type GetGamesOptions = {
  page?: number;
  pageSize?: number;
  platform?: PlatformFilter;
  category?: string;
  sortBy?: SortBy;
};

// ---------------------------------------------------------------------------
// Modelos de la interfaz
// ---------------------------------------------------------------------------

/** Juego completo, con los campos opcionales que solo trae el detalle */
export interface Game {
  id: number;
  title: string;
  thumbnail: string;
  short_description: string;
  description?: string;
  game_url: string;
  genre: string;
  platform: string;
  publisher: string;
  developer: string;
  release_date: string;
  freetogame_profile_url: string;
  screenshots?: GameScreenshot[];
  status?: string;
}

/**
 * Subconjunto minimo que necesita una tarjeta de juego.
 * Tanto `Game` como `GameListItem` son compatibles con esta forma, asi que
 * el componente de tarjeta sirve para ambos sin usar `any`.
 */
export interface GameSummary {
  id: number;
  title: string;
  thumbnail?: string;
  short_description?: string;
  genre?: string;
  platform?: string;
  status?: string;
}
