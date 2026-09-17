import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GamesApiService, GameListItem, GameListResponse } from '../../core/api/games-api';
import { Filters, FiltersBarComponent } from './ui/filters-bar.component';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll.directive';
import { GameCardComponent } from '../../shared/components/game-card/game-card.component';

const LS_KEY = 'explorar.filters.v1';
const PAGE_SIZE = 24;
/** Al buscar por texto traemos el catálogo completo para filtrar en memoria */
const SEARCH_PAGE_SIZE = 500;

/** Normaliza para comparar sin acentos ni mayúsculas */
function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FiltersBarComponent, InfiniteScrollDirective, GameCardComponent],
  templateUrl: './explorar.page.html',
  styleUrl: './explorar.page.css',
})
export class ExplorarPage implements OnInit {
  private api = inject(GamesApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  games = signal<GameListItem[]>([]);
  total = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  noMore = signal(false);
  filters = signal<Filters>({});
  page = signal(1);

  /** Texto de búsqueda actual (ya recortado) */
  searchTerm = computed(() => (this.filters().q ?? '').trim());
  isSearching = computed(() => this.searchTerm().length > 0);

  /**
   * Filtrado del lado del cliente: se recalcula solo cuando cambia
   * la lista o el término, sin volver a pedir datos a la API.
   */
  visibleGames = computed(() => {
    const q = normalize(this.searchTerm());
    const list = this.games();
    if (!q) return list;
    return list.filter(g => normalize(g.title).includes(q));
  });

  resultCount = computed(() => this.visibleGames().length);

  ngOnInit(): void {
    const fromLs: Filters = this.readFromLS();

    this.route.queryParamMap
      .pipe(
        map(qp => ({
          q: qp.get('q') || undefined,
          platform: (qp.get('platform') || undefined) as any,
          category: qp.get('category') || undefined,
          sortBy: (qp.get('sort-by') || undefined) as any,
        })),
        map(qp => {
          // Si la URL no trae nada, arrancamos con lo último guardado
          const empty = !qp.q && !qp.platform && !qp.category && !qp.sortBy;
          return (empty ? fromLs : qp) as Filters;
        }),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        // El DestroyRef explícito es obligatorio fuera del constructor:
        // takeUntilDestroyed() sin argumento solo puede usarse en un
        // contexto de inyección (constructor o inicializador de campo).
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(f => {
        this.filters.set(f);
        this.page.set(1);
        this.games.set([]);
        this.noMore.set(false);
        this.writeToLS(f);
        this.fetchPage(1, f);
      });
  }

  trackById = (_: number, g: GameListItem) => g.id;

  onFiltersChanged(f: Filters) {
    const params: Params = {};
    if (f.q) params['q'] = f.q;
    if (f.platform) params['platform'] = f.platform;
    if (f.category) params['category'] = f.category;
    if (f.sortBy) params['sort-by'] = f.sortBy;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      replaceUrl: true,
    });
  }

  onScrollBottom() {
    // En modo búsqueda ya tenemos todo el catálogo: no hay más páginas
    if (this.loading() || this.noMore() || this.isSearching()) return;
    this.fetchPage(this.page() + 1, this.filters());
  }

  private fetchPage(page: number, f: Filters) {
    this.loading.set(true);
    this.error.set(null);

    const searching = !!(f.q ?? '').trim();
    const pageSize = searching ? SEARCH_PAGE_SIZE : PAGE_SIZE;

    this.api
      .getGames({
        page,
        pageSize,
        platform: f.platform,
        category: f.category,
        sortBy: f.sortBy,
      })
      .subscribe({
        next: (res: GameListResponse) => {
          const newItems = res.items || [];
          this.games.set(searching ? newItems : [...this.games(), ...newItems]);
          this.total.set(res.total);
          this.page.set(page);
          this.loading.set(false);

          if (searching || !newItems.length || newItems.length < pageSize) {
            this.noMore.set(true);
          }
        },
        error: () => {
          this.error.set('No se pudieron cargar los juegos.');
          this.loading.set(false);
        },
      });
  }

  private readFromLS(): Filters {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Filters; }
    catch { return {}; }
  }

  private writeToLS(f: Filters) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(f)); } catch {}
  }
}
