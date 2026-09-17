import { Injectable, Injector, computed, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { deleteDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { NotificationsStore } from './notifications.store';
import { GameSummary } from '../models/game';

/** Documento guardado en users/{uid}/favorites/{gameId} */
export interface FavoriteDoc {
  gameId: number;
  title: string;
  thumbnail: string;
  genre?: string;
  platform?: string;
  createdAt?: any;
}

/** Error que lanzan los métodos de escritura cuando no hay sesión */
export const AUTH_REQUIRED = 'AUTH_REQUIRED';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private fs = inject(Firestore);
  private auth = inject(AuthService);
  private notifs = inject(NotificationsStore);
  private injector = inject(Injector);

  /**
   * Lectura en tiempo real (Read del CRUD).
   * Se re-suscribe sola cuando cambia el usuario: al cerrar sesión devuelve
   * lista vacía, al iniciar sesión trae los favoritos de ese usuario.
   */
  items = toSignal(
    this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([] as FavoriteDoc[]);
        // runInInjectionContext: el switchMap corre fuera del contexto de
        // inyección y collectionData() es una API de AngularFire.
        return runInInjectionContext(this.injector, () => {
          const col = collection(this.fs, `users/${u.uid}/favorites`);
          const q = query(col, orderBy('createdAt', 'desc'));
          return collectionData(q) as Observable<FavoriteDoc[]>;
        });
      })
    ),
    { initialValue: [] as FavoriteDoc[] }
  );

  /** Ids de los favoritos (señal derivada, para consultas rápidas) */
  ids = computed(() => this.items().map(f => Number(f.gameId)));

  total = computed(() => this.items().length);

  private get uid(): string | null {
    return this.auth.user()?.uid ?? null;
  }

  has(id: number | undefined | null): boolean {
    if (id === undefined || id === null) return false;
    return this.ids().includes(Number(id));
  }

  /** Create: guarda el juego con sus metadatos */
  async add(game: GameSummary): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(AUTH_REQUIRED);

    const gameId = Number(game.id);
    const ref = doc(this.fs, `users/${uid}/favorites/${gameId}`);

    // El id del documento es el gameId: si ya existía lo sobrescribe,
    // así nunca hay favoritos duplicados del mismo juego.
    await setDoc(ref, {
      gameId,
      title: game.title ?? '',
      thumbnail: game.thumbnail ?? '',
      genre: game.genre ?? '',
      platform: game.platform ?? '',
      createdAt: serverTimestamp(),
    });

    this.notifs.push('success', 'Favorito agregado', game.title);
  }

  /** Delete: eliminación física del documento */
  async remove(id: number): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(AUTH_REQUIRED);
    await deleteDoc(doc(this.fs, `users/${uid}/favorites/${Number(id)}`));
  }

  /** Alterna el favorito. Devuelve true si quedó agregado. */
  async toggle(game: GameSummary): Promise<boolean> {
    if (this.has(game.id)) {
      await this.remove(game.id);
      return false;
    }
    await this.add(game);
    return true;
  }

  /**
   * Borra todos los favoritos en un único lote atómico.
   * Con writeBatch, o se aplican todos los borrados o ninguno: nunca queda
   * la colección a medio vaciar si algo falla en el medio.
   */
  async clear(): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(AUTH_REQUIRED);

    const ids = this.ids();
    if (!ids.length) return;

    // Firestore admite hasta 500 operaciones por lote.
    const CHUNK = 450;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const batch = writeBatch(this.fs as any);
      for (const id of ids.slice(i, i + CHUNK)) {
        batch.delete(doc(this.fs, `users/${uid}/favorites/${id}`) as any);
      }
      await batch.commit();
    }

    this.notifs.push('info', 'Favoritos vaciados', 'Se eliminaron todos tus favoritos.');
  }
}
