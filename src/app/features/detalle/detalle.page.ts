import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GameCommunityComponent } from '../../shared/components/game-community/game-community.component';
import { GamesApiService } from '../../core/api/games-api';
import { FavoritesService } from '../../core/services/favorites.service';
import { TranslationService } from '../../core/services/translation.service';
import { parseGameId } from '../../core/utils/safe-url';

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
  private router = inject(Router);
  private favs = inject(FavoritesService);
  private translator = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  private idSig = signal<number | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);
  game = signal<any | null>(null);

  // ---------- Slider ----------
  activeIndex = signal(0);

  mediaUrls = computed<string[]>(() => {
    const g = this.game();
    const shots = (g?.screenshots ?? [])
      .map((s: any) => s?.image)
      .filter((x: any) => typeof x === 'string' && x.length > 0);

    if (shots.length) return shots;

    const thumb = g?.thumbnail;
    return typeof thumb === 'string' && thumb.length ? [thumb] : [];
  });

  // ---------- Favoritos ----------
  /** Reactivo: si cambian los favoritos desde otra pantalla, se actualiza */
  fav = computed(() => {
    this.favs.ids(); // dependencia explícita de la señal
    const id = this.idSig();
    return id !== null ? this.favs.has(id) : false;
  });

  // ---------- Traducción (módulo extra) ----------
  /** Idiomas disponibles para traducir la descripción */
  readonly languages = [
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'de', label: 'Deutsch' },
  ];

  targetLang = signal('es');
  translating = signal(false);
  translationError = signal<string | null>(null);
  showOriginal = signal(false);

  /** Caché en memoria: idioma -> texto traducido, para no repetir peticiones */
  private translations = signal<Record<string, string>>({});

  /** Traducción del idioma actualmente seleccionado (si ya existe) */
  currentTranslation = computed(() => this.translations()[this.targetLang()] ?? null);

  isTranslated = computed(() => !!this.currentTranslation() && !this.showOriginal());

  /** Texto que se muestra: traducido u original según el estado */
  displayedDescription = computed(() => {
    const original = this.game()?.description ?? '';
    const t = this.currentTranslation();
    return !t || this.showOriginal() ? original : t;
  });

  langLabel = computed(
    () => this.languages.find(l => l.code === this.targetLang())?.label ?? this.targetLang()
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        // parseGameId rechaza 0, negativos, decimales y texto.
        // Number('') vale 0, asi que comprobar solo isFinite dejaba
        // pasar /juego/0 y /juego/-1 hasta la llamada a la API.
        const id = parseGameId(pm.get('id'));
        if (id === null) {
          this.router.navigateByUrl('/404', { skipLocationChange: true });
          return;
        }

        this.idSig.set(id);
        this.activeIndex.set(0);
        this.loadGame(id);
      });
  }

  // ---------- Favoritos ----------
  async toggleFav() {
    const g = this.game();
    if (!g) return;

    try {
      await this.favs.toggle(g);
    } catch {
      // El servicio lanza AUTH_REQUIRED si no hay sesión iniciada
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/juego/${g.id}`, reason: 'auth' },
      });
    }
  }

  // ---------- Traducción ----------
  /** Cambiar de idioma traduce automáticamente si aún no lo teníamos */
  async onLangChange(code: string) {
    this.targetLang.set(code);
    this.translationError.set(null);
    this.showOriginal.set(false);
    if (!this.currentTranslation()) await this.onTranslate();
  }

  async onTranslate() {
    const g = this.game();
    if (!g?.description) return;

    // Si ya tenemos este idioma, el botón alterna original / traducción
    if (this.currentTranslation()) {
      this.showOriginal.update(v => !v);
      return;
    }

    const lang = this.targetLang();
    this.translating.set(true);
    this.translationError.set(null);
    try {
      const t = await this.translator.translate({
        gameId: Number(g.id),
        field: 'description',
        text: g.description,
        targetLang: lang,
      });
      this.translations.update(map => ({ ...map, [lang]: t }));
      this.showOriginal.set(false);
    } catch {
      this.translationError.set('No se pudo traducir la descripción. Probá de nuevo.');
    } finally {
      this.translating.set(false);
    }
  }

  // ---------- Navegación del slider ----------
  prev() {
    const total = this.mediaUrls().length;
    if (total <= 1) return;
    this.activeIndex.set((this.activeIndex() - 1 + total) % total);
  }

  next() {
    const total = this.mediaUrls().length;
    if (total <= 1) return;
    this.activeIndex.set((this.activeIndex() + 1) % total);
  }

  go(i: number) {
    const total = this.mediaUrls().length;
    if (i < 0 || i >= total) return;
    this.activeIndex.set(i);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
  }

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

  // ---------- Carga de datos ----------
  private loadGame(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getGameById(id).subscribe({
      next: g => {
        this.game.set(g);
        this.loading.set(false);
        this.activeIndex.set(0);

        // Al cambiar de juego se descarta la traducción anterior
        this.translations.set({});
        this.translationError.set(null);
        this.showOriginal.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el juego.');
        this.loading.set(false);
      },
    });
  }
}
