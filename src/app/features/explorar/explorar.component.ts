import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamesApiService, GameListItem } from '../../core/api/games-api';
import { GameCardComponent } from '../../shared/components/game-card/game-card.component';

@Component({
  standalone: true,
  selector: 'app-explorar-legacy', // 👈 importante: NO uses 'app-explorar' si ya tenés ExplorarPage
  imports: [CommonModule, FormsModule, GameCardComponent],
  template: `
    <section>
      <div class="toolbar">
        <select [(ngModel)]="platform" class="input" (change)="reload()">
          <option value="all">Todas las plataformas</option>
          <option value="pc">PC (Windows)</option>
          <option value="browser">Web Browser</option>
        </select>

        <input class="input"
               placeholder="Categoría (mmorpg, shooter, moba...)"
               [(ngModel)]="category"
               (keyup.enter)="reload()"/>

        <select [(ngModel)]="sortBy" class="input" (change)="reload()">
          <option value="relevance">Relevancia</option>
          <option value="release-date">Fecha de lanzamiento</option>
          <option value="popularity">Popularidad</option>
          <option value="alphabetical">Alfabético</option>
        </select>

        <button class="btn" (click)="reload()">Aplicar</button>
      </div>

      <div *ngIf="loading()" class="notice">Cargando juegos...</div>
      <div *ngIf="error()" class="notice" style="border-color:#ff5575; color:#ff5575">
        Error: {{ error() }}
      </div>

      <div class="grid" *ngIf="!loading() && !error()">
        <app-game-card *ngFor="let g of games()" [game]="g"></app-game-card>
      </div>
    </section>
  `
})
export class ExplorarLegacyComponent {
  private api = inject(GamesApiService);

  platform: 'pc' | 'browser' | 'all' = 'all';
  category = '';
  sortBy: 'relevance' | 'release-date' | 'popularity' | 'alphabetical' = 'relevance';

  loading = signal(true);
  error = signal<string | null>(null);
  games = signal<GameListItem[]>([]);

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getGames({
      page: 1,
      pageSize: 24,
      platform: this.platform,
      category: this.category || undefined,
      sortBy: this.sortBy,
    }).subscribe({
      next: (res) => {
        this.games.set(res.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los juegos.');
        this.loading.set(false);
      }
    });
  }
}
