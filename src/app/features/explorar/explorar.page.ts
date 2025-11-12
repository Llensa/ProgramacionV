import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesApiService, GameListItem, GameListResponse } from '../../core/api/games-api';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <header class="head">
        <h1>Explorar juegos</h1>
        <span class="meta" *ngIf="total() !== null">{{ total() }} juegos</span>
      </header>

      <p class="muted" *ngIf="loading()">Cargando juegos...</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>

      <div class="grid" *ngIf="!loading() && games().length">
        <article class="card" *ngFor="let g of games()">
          <img [src]="g.thumbnail" [alt]="g.title" loading="lazy" />
          <div class="card-body">
            <h2>{{ g.title }}</h2>
            <p class="genre">{{ g.genre }} · {{ g.platform }}</p>
            <p class="desc">{{ g.short_description }}</p>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .page{background:#141421;border:1px solid #222334;border-radius:14px;padding:16px}
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .meta,.muted{color:#a3a7b3}.error{color:#ff6b6b}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
    .card{background:#181828;border:1px solid #222334;border-radius:12px;overflow:hidden}
    .card img{width:100%;height:140px;object-fit:cover}
    .card-body{padding:10px 12px}
    .genre{color:#a3a7b3;margin:4px 0 6px;font-size:.85rem}
    .desc{color:#a3a7b3;font-size:.85rem}
  `],
})
export class ExplorarPage implements OnInit {
  private api = inject(GamesApiService);
  games = signal<GameListItem[]>([]);
  total = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(1); }

  private cargar(page: number) {
    this.loading.set(true);
    this.api.getGames({ page, pageSize: 24 }).subscribe({
      next: (res: GameListResponse) => {
        this.games.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudieron cargar los juegos.'); this.loading.set(false); },
    });
  }
}
