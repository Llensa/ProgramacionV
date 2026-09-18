/**
 * Utilidades de texto compartidas.
 */

/**
 * Normaliza una cadena para comparaciones de busqueda: la pasa a minusculas
 * y le saca los acentos, de modo que "pokemon" encuentre "Pokemon".
 *
 * El truco esta en `normalize('NFD')`, que separa cada letra acentuada en
 * la letra base mas el acento, y despues borra los acentos por rango unicode.
 */
export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
