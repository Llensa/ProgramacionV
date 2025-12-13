import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../../core/models/game';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a class="card" [routerLink]="['/juego', game.id]">
      <div class="card-image">
        <img [src]="game.thumbnail" [alt]="game.title" loading="lazy" />

        <button
          type="button"
          class="fav-btn"
          (click)="$event.preventDefault(); $event.stopPropagation(); toggleFav()"
          [class.active]="isFav()"
          aria-label="Toggle favorito"
        >
          {{ isFav() ? '★' : '☆' }}
        </button>
      </div>

      <div class="card-content">
        <h3>{{ game.title }}</h3>
        <span class="badge">{{ game.genre }}</span>
      </div>
    </a>
  `,
  styles: [`
    .card{display:block;background:var(--bg-card,#181828);border:1px solid #222334;border-radius:12px;overflow:hidden;text-decoration:none}
    .card:hover{transform:translateY(-3px);transition:.15s;box-shadow:0 10px 20px rgba(0,0,0,.35)}
    .card-image{position:relative}
    img{width:100%;height:160px;object-fit:cover;display:block}
    .fav-btn{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:1.2rem;cursor:pointer;border-radius:999px;width:38px;height:38px}
    .fav-btn.active{color:#ffdd57}
    .card-content{padding:10px 12px}
    h3{margin:0;color:#e6e6f0;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .badge{display:inline-block;margin-top:6px;font-size:.75rem;color:#a3a7b3;border:1px solid #2b2b44;padding:2px 6px;border-radius:999px}
  `]
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;

  private favs = inject(FavoritesService);

  isFav = computed(() => this.favs.has(this.game.id));

  toggleFav() {
    this.favs.toggle(this.game.id);
  }
}
