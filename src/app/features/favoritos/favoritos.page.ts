import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { GamesApiService } from '../../core/api/games-api';
import { FavoritesService } from '../../core/services/favorites.service';
import { Game } from '../../core/models/game';
import { GameCardComponent } from '../../shared/components/game-card/game-card.component';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './favoritos.page.html',
  styleUrl: './favoritos.page.css',
})
export class FavoritosPage {
  private api = inject(GamesApiService);
  private favs = inject(FavoritesService);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  error = signal<string | null>(null);
  games = signal<Game[]>([]);

  // ✅ señal reactiva con los ids
  ids = computed(() => this.favs.ids());
  total = computed(() => this.ids().length);

  constructor() {
    // ✅ reactivo real: cada vez que cambia ids(), recarga lista
    effect(() => {
      const ids = this.ids();
      this.loadFavorites(ids);
    });
  }

  clearAll() {
    this.favs.clear();
  }

  private loadFavorites(ids: number[]) {
    this.error.set(null);

    if (!ids.length) {
      this.games.set([]);
      return;
    }

    this.loading.set(true);

    forkJoin(
      ids.map((id) =>
        this.api.getGameById(id).pipe(
          catchError(() => of(null))
        )
      )
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((arr) => (arr || []).filter(Boolean) as Game[])
      )
      .subscribe({
        next: (list) => {
          // si querés mantener el mismo orden que los ids:
          const mapById = new Map(list.map((g: any) => [Number(g.id), g]));
          const ordered = ids.map((id) => mapById.get(id)).filter(Boolean) as Game[];

          this.games.set(ordered);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar tus favoritos.');
          this.loading.set(false);
        },
      });
  }
}
