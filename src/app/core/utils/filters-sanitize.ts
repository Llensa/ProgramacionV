import { PlatformFilter, SortBy } from '../models/game';

/**
 * Los filtros viajan en la URL como query params, asi que cualquiera puede
 * escribir lo que quiera ahi. Antes de mandarlos a la API hay que confirmar
 * que son uno de los valores esperados; si no, se ignoran.
 *
 * Sin esto, `?platform=cualquier-cosa` llegaba tal cual a la peticion y la
 * API respondia con un error que el usuario veia como un fallo de la app.
 */

const PLATFORMS: readonly PlatformFilter[] = ['pc', 'browser', 'all'];

const SORTS: readonly SortBy[] = ['relevance', 'release-date', 'popularity', 'alphabetical'];

export function sanitizePlatform(raw: string | null | undefined): PlatformFilter | undefined {
  const v = (raw ?? '').trim().toLowerCase();
  return PLATFORMS.includes(v as PlatformFilter) ? (v as PlatformFilter) : undefined;
}

export function sanitizeSortBy(raw: string | null | undefined): SortBy | undefined {
  const v = (raw ?? '').trim().toLowerCase();
  return SORTS.includes(v as SortBy) ? (v as SortBy) : undefined;
}

/**
 * La categoria es texto libre en la API, pero se acota igual: solo letras,
 * numeros y guiones, y un largo razonable.
 */
export function sanitizeCategory(raw: string | null | undefined): string | undefined {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v || v.length > 40) return undefined;
  return /^[a-z0-9-]+$/.test(v) ? v : undefined;
}
