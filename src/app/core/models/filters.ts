import { PlatformFilter, SortBy } from './game';

/**
 * Estado de los filtros de la pantalla Explorar.
 *
 * Vive en `core/models` y no dentro del componente de la barra de filtros
 * porque lo usan tanto ese componente como la pagina que lo contiene, y
 * ademas se serializa como query params en la URL y en localStorage.
 */
export type Filters = {
  q?: string;
  platform?: PlatformFilter;
  category?: string;
  sortBy?: SortBy;
};
