import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GamesApiService } from '../../core/api/games-api';
import { FavoritesService } from '../../core/favorites/favorites.service';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="detail" *ngIf="game() as g">
      <header class="head">
        <h1>{{ g.title }}</h1>
        <button class="fav" (click)="toggleFav(g.id); $event.stopPropagation()">
          {{ fav() ? '★ Quitar de favoritos' : '☆ Agregar a favoritos' }}
        </button>
      </header>

      <div class="meta">
        <span>{{ g.genre }}</span>
        <span>·</span>
        <span>{{ g.platform }}</span>
        <span *ngIf="g.publisher">· {{ g.publisher }}</span>
        <span *ngIf="g.developer">· {{ g.developer }}</span>
        <span *ngIf="g.release_date">· {{ g.release_date }}</span>
      </div>

      <p class="desc">{{ g.description }}</p>

      <div class="gallery" *ngIf="g.screenshots?.length">
        <img *ngFor="let s of g.screenshots" [src]="s.image" [alt]="g.title" loading="lazy"/>
      </div>

      <div class="actions">
        <a class="btn-primary" [href]="g.game_url" target="_blank" rel="noopener">
          Descargar / Sitio oficial
        </a>
        <a class="btn-secondary" [href]="g.freetogame_profile_url" target="_blank" rel="noopener">
          Ver en FreeToGame
        </a>
      </div>
    </section>

    <p class="muted" *ngIf="loading()">Cargando...</p>
    <p class="error" *ngIf="error()">{{ error() }}</p>
  `,
  styles: [`
    .detail{background:#141421;border:1px solid #222334;border-radius:14px;padding:16px;max-width:1200px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .fav{background:transparent;color:#ffd86b;border:1px solid #3a3218;padding:8px 12px;border-radius:10px;cursor:pointer}
    .meta{color:#a3a7b3;margin:.4rem 0 1rem;display:flex;gap:.5rem;flex-wrap:wrap}
    .desc{color:#cfd1db;line-height:1.6}
    .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin:16px 0}
    .gallery img{width:100%;height:180px;object-fit:cover;border-radius:10px;border:1px solid #222334}
    .actions{display:flex;gap:12px;margin-top:8px;flex-wrap:wrap}
    .btn-primary{background:#a470ff;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px}
    .btn-secondary{background:#25253a;color:#e6e6f0;text-decoration:none;padding:10px 14px;border-radius:10px;border:1px solid #343455}
    .muted{color:#a3a7b3}
    .error{color:#ff6b6b}
    @media (max-width:768px){ .detail{padding:12px} .gallery img{height:150px} }
  `],
})
export class DetallePage implements OnInit {
  private api = inject(GamesApiService);
  private route = inject(ActivatedRoute);
  private favs = inject(FavoritesService);

  loading = signal(false);
  error = signal<string | null>(null);
  game = signal<any | null>(null);
  fav = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.fav.set(this.favs.has(id));
    this.loading.set(true);
    this.api.getGameById(id).subscribe({
      next: g => { this.game.set(g); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el juego.'); this.loading.set(false); }
    });
  }

  toggleFav(id: number){
    this.favs.toggle(id);
    this.fav.set(this.favs.has(id));
  }
}
