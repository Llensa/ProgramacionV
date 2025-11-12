import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';

import { GamesApiService, GameListItem, GameListResponse } from '../../core/api/games-api';
import { Filters, FiltersBarComponent } from './ui/filters-bar.component';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll.directive';

const LS_KEY = 'explorar.filters.v1';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, RouterLink, FiltersBarComponent, InfiniteScrollDirective],
  template: `
    <section class="page">
      <header class="head">
        <h1>Explorar juegos</h1>
        <span class="meta" *ngIf="total() !== null">{{ total() }} juegos</span>
      </header>

      <app-filters-bar
        [value]="filters()"
        (changed)="onFiltersChanged($event)">
      </app-filters-bar>

      <p class="muted" *ngIf="loading() && !games().length">Cargando juegos...</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>

      <div class="grid">
        <article class="card" *ngFor="let g of games()">
          <a class="media" [routerLink]="['/juego', g.id]">
            <img [src]="g.thumbnail" [alt]="g.title" loading="lazy" />
          </a>

          <div class="card-body">
            <h2 class="title">
              <a [routerLink]="['/juego', g.id]">{{ g.title }}</a>
            </h2>
            <p class="genre">{{ g.genre }} · {{ g.platform }}</p>
            <p class="desc">{{ g.short_description }}</p>
          </div>
        </article>
      </div>

      <div appInfiniteScroll (reachedBottom)="onScrollBottom()"></div>
      <p class="muted" *ngIf="loading() && games().length">Cargando más...</p>
      <p class="muted end" *ngIf="noMore()">No hay más resultados</p>
    </section>
  `,
  styles: [`
    .page{background:#141421;border:1px solid #222334;border-radius:14px;padding:16px;max-width:1400px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .meta,.muted{color:#a3a7b3}.error{color:#ff6b6b}

    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:12px}

    .card{
      background:#181828;border:1px solid #222334;border-radius:12px;overflow:hidden;
      transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
    }
    .card:hover{ transform: translateY(-2px); border-color:#343455; box-shadow:0 6px 18px rgba(0,0,0,.3) }

    .media{ display:block; width:100%; height:160px; background:#0f0f18 }
    .media img{ width:100%; height:100%; object-fit:cover; display:block }

    .card-body{ padding:10px 12px }
    .title{ margin:0 0 4px }
    .title a{ color:#fff; text-decoration:none }
    .title a:hover{ text-decoration:underline }
    .genre{color:#a3a7b3;margin:4px 0 6px;font-size:.85rem}
    .desc{color:#a3a7b3;font-size:.9rem}
    .end{text-align:center;margin-top:12px}

    @media (max-width: 768px){
      .page{ padding:12px; border-radius:10px }
      .media{ height:140px }
    }
  `],
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
    this.api.getGames({
      page, pageSize: 24,
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
      error: () => { this.error.set('No se pudieron cargar los juegos.'); this.loading.set(false); },
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
