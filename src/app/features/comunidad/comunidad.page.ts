import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CommunityService,
  GamePublicDoc,
  GameCommentDoc,
} from '../../core/services/community.service';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './comunidad.page.html',
  styleUrl: './comunidad.page.css',
})
export class ComunidadPage {
  private community = inject(CommunityService);
  private destroyRef = inject(DestroyRef);

  topGames = signal<GamePublicDoc[]>([]);
  recent = signal<GameCommentDoc[]>([]);

  constructor() {
    // La página ya no arma queries de Firestore: delega en el servicio,
    // que es el único que conoce la estructura de las colecciones.
    this.community
      .watchTopGames(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.topGames.set(list));

    this.community
      .watchRecentComments(20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.recent.set(list));
  }
}
