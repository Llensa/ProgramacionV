import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameApiService } from '../../core/services/game-api.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { NotificationsStore } from '../../core/services/notifications.store';
import { Game, PlatformFilter, SortBy } from '../../core/models/game';
import { GameCardComponent } from '../../shared/components/game-card/game-card.component';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-explorar',
  imports: [CommonModule, FormsModule, GameCardComponent],
  template: `
  <section>
    <div class="toolbar">
      <select [(ngModel)]="platform" class="input" (change)="reload()">
        <option value="all">Todas las plataformas</option>
        <option value="pc">PC (Windows)</option>
        <option value="browser">Web Browser</option>
      </select>

      <input class="input" placeholder="Categoría (mmorpg, shooter, moba...)" [(ngModel)]="category" (keyup.enter)="reload()"/>
      <select [(ngModel)]="sortBy" class="input" (change)="reload()">
        <option value="relevance">Relevancia</option>
        <option value="release-date">Fecha de lanzamiento</option>
        <option value="popularity">Popularidad</option>
        <option value="alphabetical">Alfabético</option>
      </select>
      <button class="btn" (click)="reload()">Aplicar</button>
    </div>

    <div *ngIf="loading()" class="notice">Cargando juegos...</div>
    <div *ngIf="error()" class="notice" style="border-color:var(--danger); color:var(--danger)">Error: {{ error() }}</div>

    <div class="grid" *ngIf="!loading() && !error()">
      <app-game-card
        *ngFor="let g of games()"
        [game]="g"
        [isFav]="fav.isFavorite(g.id)"
        (toggleFav)="onToggleFav($event)"
        (open)="goDetalle($event)">
      </app-game-card>
    </div>
  </section>
  `
})
export class ExplorarComponent {
  private api = inject(GameApiService);
  fav = inject(FavoritesService);
  private notif = inject(NotificationsStore);
  private router = inject(Router);

  platform: PlatformFilter = 'all';
  category = '';
  sortBy: SortBy = 'relevance';

  loading = signal(true);
  error = signal<string | null>(null);
  games = signal<Game[]>([]);

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    this.api.getGames({ platform: this.platform, category: this.category || undefined, sortBy: this.sortBy })
      .subscribe({
        next: (data) => { this.games.set(data); this.loading.set(false); },
        error: (e) => { this.error.set(e.message); this.loading.set(false); }
      });
  }

  onToggleFav(game: Game) {
    const wasFav = this.fav.isFavorite(game.id);
    this.fav.toggle(game);
    if (wasFav) this.notif.push('warning', 'Favorito quitado', game.title);
    else this.notif.push('success', 'Agregado a Favoritos', game.title);
  }

  goDetalle(id: number) { this.router.navigate(['/detalle', id]); }
}
