import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="card" (click)="goToDetail()">
      <div class="card-image">
        <img
          [src]="game?.thumbnail"
          [alt]="game?.title"
          [attr.loading]="eager ? 'eager' : 'lazy'"
          [attr.fetchpriority]="eager ? 'high' : 'auto'"
          decoding="async"
        />

        <button
          class="fav-btn"
          type="button"
          (click)="$event.stopPropagation(); toggleFav()"
          [class.active]="isFav()"
          [attr.aria-pressed]="isFav()"
          aria-label="Favorito"
        >
          {{ isFav() ? '★' : '☆' }}
        </button>
      </div>

      <div class="card-content">
        <h3 class="title">{{ game?.title }}</h3>
        <p class="meta">{{ game?.genre }} · {{ game?.platform }}</p>
        <p class="desc" *ngIf="game?.short_description">{{ game.short_description }}</p>
      </div>
    </article>
  `,
  styles: [`
    .card{
      background:#141b27;
      border:1px solid rgba(255,255,255,.08);
      border-radius:12px;
      overflow:hidden;
      cursor:pointer;
      transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    }
    .card:hover{
      transform:translateY(-4px);
      box-shadow:0 18px 40px rgba(0,0,0,.45);
      border-color:rgba(164,112,255,.35);
    }

    .card-image{ position:relative; }
    img{ width:100%; height:170px; object-fit:cover; display:block; }

    .fav-btn{
      position:absolute;
      top:10px; right:10px;
      width:40px; height:40px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(0,0,0,.45);
      color:#fff;
      font-size:18px;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      backdrop-filter: blur(6px);
      transition: transform .12s ease, border-color .12s ease, color .12s ease;
    }
    .fav-btn:hover{ transform:scale(1.06); border-color:rgba(164,112,255,.35); }
    .fav-btn.active{ color:#ffd86b; border-color:rgba(255,216,107,.35); }

    .card-content{ padding:12px; }
    .title{
      margin:0;
      color:#e6e6f0;
      font-size:1.05rem;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .meta{ margin:6px 0 0; color:#a3a7b3; font-size:.85rem; }
    .desc{ margin:8px 0 0; color:#a3a7b3; font-size:.9rem; line-height:1.35; }
  `]
})
export class GameCardComponent {
  @Input({ required: true }) game!: any;
  @Input() eager = false;

  private router = inject(Router);
  private favs = inject(FavoritesService);

  isFav = computed(() => {
    this.favs.ids(); // ✅ dependencia reactiva explícita
    return this.favs.has(this.game?.id);
  });

  toggleFav() {
    this.favs.toggle(this.game.id);
  }

  goToDetail() {
    this.router.navigate(['/juego', this.game.id]);
  }
}
