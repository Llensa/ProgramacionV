import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CommunityService } from '../../core/services/community.service';
import { GameCommentDoc, GamePublicDoc } from '../../core/models/community';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

type Tab = 'recientes' | 'top';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './comunidad.page.html',
  styleUrl: './comunidad.page.css',
})
export class ComunidadPage {
  private community = inject(CommunityService);
  private destroyRef = inject(DestroyRef);

  topGames = signal<GamePublicDoc[]>([]);
  recent = signal<GameCommentDoc[]>([]);
  loading = signal(true);

  /** Pestaña activa en pantallas chicas (en escritorio se ven las dos columnas) */
  tab = signal<Tab>('recientes');

  // ---------- Métricas de cabecera ----------
  totalComments = computed(() =>
    this.topGames().reduce((acc, g) => acc + Number(g.commentCount ?? 0), 0)
  );

  totalRatings = computed(() =>
    this.topGames().reduce((acc, g) => acc + Number(g.ratingCount ?? 0), 0)
  );

  /** Participantes distintos según los comentarios recientes */
  activeUsers = computed(() => new Set(this.recent().map(c => c.uid)).size);

  constructor() {
    // La página no arma queries de Firestore: delega en el servicio,
    // que es el único que conoce la estructura de las colecciones.
    this.community
      .watchTopGames(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => {
        this.topGames.set(list);
        this.loading.set(false);
      });

    this.community
      .watchRecentComments(20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => {
        this.recent.set(list);
        this.loading.set(false);
      });
  }

  setTab(t: Tab) {
    this.tab.set(t);
  }

  /** Convierte el Timestamp de Firestore en texto relativo ("hace 5 min") */
  timeAgo(createdAt: any): string {
    const ms = createdAt?.toMillis?.() ?? (createdAt?.seconds ? createdAt.seconds * 1000 : null);
    if (!ms) return '';

    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'recién';
    if (min < 60) return `hace ${min} min`;

    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;

    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} d`;

    return new Date(ms).toLocaleDateString();
  }

  /** Estrellas llenas para un promedio dado */
  starsFor(avg: number | undefined): string {
    const n = Math.round(Number(avg ?? 0));
    return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
  }

  trackComment = (_: number, c: GameCommentDoc) => c.id ?? '';
  trackGame = (_: number, g: GamePublicDoc) => g.gameId ?? 0;
}
