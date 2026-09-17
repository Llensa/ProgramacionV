import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FavoritesService } from '../../core/services/favorites.service';
import { ToastStore } from '../../core/services/toast.store';
import { GameSummary } from '../../core/models/game';
import { GameCardComponent } from '../../shared/components/game-card/game-card.component';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './favoritos.page.html',
  styleUrl: './favoritos.page.css',
})
export class FavoritosPage {
  private favs = inject(FavoritesService);
  private toast = inject(ToastStore);

  busy = signal(false);
  error = signal<string | null>(null);

  total = this.favs.total;

  /**
   * Los favoritos ya traen título y miniatura desde Firestore,
   * así que la vista se arma sin pedirle nada a la API externa.
   */
  games = computed<GameSummary[]>(() =>
    this.favs.items().map(f => ({
      id: Number(f.gameId),
      title: f.title,
      thumbnail: f.thumbnail,
      genre: f.genre,
      platform: f.platform,
    }))
  );

  async clearAll() {
    if (!this.total()) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.favs.clear();
      this.toast.show('success', 'Listo', 'Se vaciaron tus favoritos.');
    } catch {
      this.error.set('No se pudieron eliminar los favoritos.');
    } finally {
      this.busy.set(false);
    }
  }
}
