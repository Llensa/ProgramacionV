/**
 * Claves de localStorage usadas por la aplicacion.
 *
 * Estaban repartidas en tres archivos distintos y con tres convenciones de
 * nombre distintas. Centralizarlas evita colisiones y deja a la vista todo
 * lo que la aplicacion guarda en el navegador.
 *
 * OJO: la clave del tema tambien esta escrita a mano en `src/index.html`,
 * en el script que aplica el tema antes del primer pintado. Si se cambia
 * aca, hay que cambiarla tambien alla.
 */
export const STORAGE_KEYS = {
  /** Tema visual elegido: 'dark' | 'light' */
  theme: 'yenzaplayg.theme',

  /** Notificaciones del centro de avisos */
  notifications: 'yenzaplayg:notifications',

  /** Ultimos filtros aplicados en la pantalla Explorar */
  explorarFilters: 'explorar.filters.v1',
} as const;
