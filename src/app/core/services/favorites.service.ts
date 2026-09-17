import { Injectable, Injector, computed, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AuthService } from './auth.service';
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
  private injector = inject(Injector);

  /**
   * Lectura en tiempo real (Read del CRUD).
   * Se re-suscribe sola cuando cambia el usuario: al cerrar sesión
   * devuelve una lista vacía, al iniciar sesión trae los del usuario.
   */
  items = toSignal(
    this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([] as FavoriteDoc[]);
        // runInInjectionContext: el switchMap corre fuera del contexto de
        // inyección, y collectionData() es una API de AngularFire.
        return runInInjectionContext(this.injector, () => {
          const col = collection(this.fs, `users/${u.uid}/favorites`);
          const q = query(col, orderBy('createdAt', 'desc'));
          return collectionData(q) as Observable<FavoriteDoc[]>;
        });
      })
    ),
    { initialValue: [] as FavoriteDoc[] }
  );

  /** Ids de los juegos favoritos (señal derivada, para consultas rápidas) */
  ids = computed(() => this.items().map(f => Number(f.gameId)));

  total = computed(() => this.items().length);

  private get uid(): string | null {
    return this.auth.user()?.uid ?? null;
  }

  has(id: number | undefined): boolean {
    if (id === undefined || id === null) return false;
    return this.ids().includes(Number(id));
  }

  /** Create: guarda el juego con sus metadatos */
  async add(game: GameSummary): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(AUTH_REQUIRED);

    const gameId = Number(game.id);
    const ref = doc(this.fs, `users/${uid}/favorites/${gameId}`);

    // setDoc con id = gameId: si ya existe lo sobrescribe,
    // así nunca hay favoritos duplicados del mismo juego.
    await setDoc(ref, {
      gameId,
      title: game.title ?? '',
      thumbnail: game.thumbnail ?? '',
      genre: game.genre ?? '',
      platform: game.platform ?? '',
      createdAt: serverTimestamp(),
    });
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

  /** Borra todos los favoritos del usuario */
  async clear(): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(AUTH_REQUIRED);
    await Promise.all(this.ids().map(id => this.remove(id)));
  }
}
