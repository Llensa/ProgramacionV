import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GameCommunityComponent } from '../../shared/components/game-community/game-community.component';
import { GamesApiService } from '../../core/api/games-api';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, GameCommunityComponent],
  templateUrl: './detalle.page.html',
  styleUrl: './detalle.page.css',
})
export class DetallePage implements OnInit {
  private api = inject(GamesApiService);
  private route = inject(ActivatedRoute);
  private favs = inject(FavoritesService);
  private destroyRef = inject(DestroyRef);

  private idSig = signal<number | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);
  game = signal<any | null>(null);

  // Slider
  activeIndex = signal(0);

  // URLs de media: screenshots si hay, si no thumbnail
  mediaUrls = computed<string[]>(() => {
    const g = this.game();
    const shots = (g?.screenshots ?? [])
      .map((s: any) => s?.image)
      .filter((x: any) => typeof x === 'string' && x.length > 0);

    if (shots.length) return shots;

    const thumb = g?.thumbnail;
    return typeof thumb === 'string' && thumb.length ? [thumb] : [];
  });

  // ✅ Reactivo real: si cambiás favoritos desde otra pantalla, esto se actualiza
  fav = computed(() => {
    this.favs.ids(); // dependencia reactiva explícita
    const id = this.idSig();
    return id !== null ? this.favs.has(id) : false;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        const id = Number(pm.get('id'));
        if (!Number.isFinite(id)) {
          this.error.set('ID inválido.');
          return;
        }

        this.idSig.set(id);
        this.activeIndex.set(0);
        this.loadGame(id);
      });

    // Clamp del índice si cambia el set de imágenes
    computed(() => {
      const total = this.mediaUrls().length;
      const i = this.activeIndex();
      if (!total) return;
      if (i >= total) this.activeIndex.set(0);
    })();
  }

  toggleFav() {
    const id = this.idSig();
    if (id === null) return;
    this.favs.toggle(id);
  }

  prev() {
    const total = this.mediaUrls().length;
    if (total <= 1) return;
    const i = this.activeIndex();
    this.activeIndex.set((i - 1 + total) % total);
  }

  next() {
    const total = this.mediaUrls().length;
    if (total <= 1) return;
    const i = this.activeIndex();
    this.activeIndex.set((i + 1) % total);
  }

  go(i: number) {
    const total = this.mediaUrls().length;
    if (i < 0 || i >= total) return;
    this.activeIndex.set(i);
  }

  // Teclado
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
  }

  // Swipe (móvil)
  private startX: number | null = null;

  onPointerDown(ev: PointerEvent) {
    this.startX = ev.clientX;
  }

  onPointerUp(ev: PointerEvent) {
    if (this.startX === null) return;
    const dx = ev.clientX - this.startX;
    this.startX = null;

    if (Math.abs(dx) < 40) return;
    dx > 0 ? this.prev() : this.next();
  }

  onPointerCancel() {
    this.startX = null;
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.style.opacity = '0';
    img.style.pointerEvents = 'none';
  }

  private loadGame(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getGameById(id).subscribe({
      next: g => {
        this.game.set(g);
        this.loading.set(false);
        this.activeIndex.set(0);
      },
      error: () => {
        this.error.set('No se pudo cargar el juego.');
        this.loading.set(false);
      }
    });
  }
}
