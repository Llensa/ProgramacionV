export interface Game {
  id: number;
  title: string;
  thumbnail: string;
  short_description: string;
  // Agregamos description como opcional (?) para que funcione en el detalle
  description?: string;
  game_url: string;
  genre: string;
  platform: string;
  publisher: string;
  developer: string;
  release_date: string;
  freetogame_profile_url: string;
  // Agregamos screenshots para la galería
  screenshots?: { id: number; image: string }[];
  status?: string;
}

export type PlatformFilter = 'pc' | 'browser' | 'all';
export type SortBy = 'relevance' | 'release-date' | 'popularity' | 'alphabetical';
/**
 * Subconjunto mínimo de datos que necesita una tarjeta de juego.
 * Tanto `Game` como `GameListItem` son compatibles con esta forma, así que
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
