/**
 * Documento guardado en `users/{uid}/favorites/{gameId}`.
 *
 * Los datos del juego (titulo, miniatura, genero, plataforma) se guardan
 * desnormalizados a proposito: asi la pantalla de Favoritos se arma con una
 * sola lectura, sin volver a consultar la API una vez por juego.
 */
export interface FavoriteDoc {
  gameId: number;
  title: string;
  thumbnail: string;
  genre?: string;
  platform?: string;
  createdAt?: any;
}
