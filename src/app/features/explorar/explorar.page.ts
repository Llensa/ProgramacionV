import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';

import { GamesApiService, GameListItem, GameListResponse } from '../../core/api/games-api';
import { Filters, FiltersBarComponent } from './ui/filters-bar.component';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll.directive';
import { GameCardComponent } from '../../shared/components/game-card/game-card.component';

const LS_KEY = 'explorar.filters.v1';

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

  games = signal<GameListItem[]>([]);
  total = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  noMore = signal(false);
  filters = signal<Filters>({});
  page = signal(1);

  ngOnInit(): void {
    const fromLs: Filters = this.readFromLS();

    const qp$ = this.route.queryParamMap.pipe(
      map(q => ({
        platform: (q.get('platform') || undefined) as any,
        category: q.get('category') || undefined,
        sortBy: (q.get('sort-by') || undefined) as any,
      })),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );

    combineLatest([of(fromLs), qp$]).pipe(
      map(([ls, qp]) => ({ ...ls, ...qp } as Filters)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(f => {
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
    if (f.platform) params['platform'] = f.platform;
    if (f.category) params['category'] = f.category;
    if (f.sortBy)  params['sort-by'] = f.sortBy;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onScrollBottom() {
    if (this.loading() || this.noMore()) return;
    const nextPage = this.page() + 1;
    this.fetchPage(nextPage, this.filters());
  }

  private fetchPage(page: number, f: Filters) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getGames({
      page,
      pageSize: 24,
      platform: f.platform,
      category: f.category,
      sortBy: f.sortBy,
    }).subscribe({
      next: (res: GameListResponse) => {
        const current = this.games();
        const newItems = res.items || [];
        this.games.set([...current, ...newItems]);
        this.total.set(res.total);
        this.page.set(page);
        this.loading.set(false);
        if (!newItems.length || newItems.length < 24) this.noMore.set(true);
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
