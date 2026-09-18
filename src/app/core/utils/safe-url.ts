/**
 * Validacion de rutas que vienen de la URL.
 *
 * El `returnUrl` del login lo escribe el guard, pero cualquiera puede
 * cambiarlo a mano en la barra de direcciones. Antes de pasarselo al Router
 * hay que confirmar que es una ruta interna de la aplicacion.
 */

/** Ruta a la que se cae cuando el returnUrl recibido no es confiable */
export const DEFAULT_RETURN_URL = '/explorar';

/**
 * Devuelve la ruta si es interna y segura; si no, la ruta por defecto.
 *
 * Se rechaza todo lo que no empiece con una sola barra: las URLs absolutas
 * (`https://...`), los esquemas raros (`javascript:`) y las que empiezan con
 * doble barra (`//otro-sitio.com`), que el navegador interpreta como externas.
 */
export function safeReturnUrl(raw: string | null | undefined): string {
  const url = (raw ?? '').trim();

  if (!url) return DEFAULT_RETURN_URL;
  if (!url.startsWith('/')) return DEFAULT_RETURN_URL;
  if (url.startsWith('//')) return DEFAULT_RETURN_URL;
  if (url.includes('\\')) return DEFAULT_RETURN_URL;

  return url;
}

/**
 * Valida el parametro `:id` de la ruta de detalle.
 * Devuelve el numero si es un entero positivo; si no, null.
 *
 * `Number('')` vale 0 y `Number.isFinite(0)` es true, asi que comprobar
 * solo que sea finito deja pasar `/juego/0`, `/juego/-1` y `/juego/1.5`.
 */
export function parseGameId(raw: string | null | undefined): number | null {
  const s = (raw ?? '').trim();
  if (!/^\d+$/.test(s)) return null;

  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
