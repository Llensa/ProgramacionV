import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { FavoritesService } from '../../../core/services/favorites.service';
import { ToastStore } from '../../../core/services/toast.store';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { GameSummary } from '../../../core/models/game';
import { FALLBACK_IMG } from '../../constants/fallback-image';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, TruncatePipe],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent {
  /** Datos del juego a mostrar (tipado, ya no `any`) */
  @Input({ required: true }) game!: GameSummary;

  /** true en las primeras tarjetas visibles: carga la imagen con prioridad alta */
  @Input() eager = false;

  private router = inject(Router);
  private favs = inject(FavoritesService);
  private toast = inject(ToastStore);

  private imgFailed = signal(false);
  imgLoaded = signal(false);

  /** Miniatura real, o placeholder si falta o falló */
  imgSrc = computed(() => {
    const src = this.game?.thumbnail;
    if (!this.imgFailed() && typeof src === 'string' && src.length) return src;
    return FALLBACK_IMG;
  });

  /** Reactivo: se recalcula si cambian los favoritos desde cualquier pantalla */
  isFav = computed(() => {
    this.favs.ids(); // dependencia explícita de la señal
    return this.favs.has(this.game?.id);
  });

  onImgLoad() {
    this.imgLoaded.set(true);
  }

  onImgError() {
    this.imgFailed.set(true);
    // el placeholder es un data-URI: ya está disponible, se considera cargado
    this.imgLoaded.set(true);
  }

  toggleFav() {
    const was = this.isFav();
    this.favs.toggle(this.game.id);

    this.toast.show(
      was ? 'warning' : 'success',
      was ? 'Favorito quitado' : 'Agregado a favoritos',
      this.game?.title
    );
  }

  goToDetail() {
    this.router.navigate(['/juego', this.game.id]);
  }

  /** Permite abrir el detalle con teclado (Enter o barra espaciadora) */
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.goToDetail();
    }
  }
}
