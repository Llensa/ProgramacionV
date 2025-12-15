import { Component, DestroyRef, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  Firestore,
  collection,
  collectionData,
  collectionGroup,
  query,
  orderBy,
  limit,
} from "@angular/fire/firestore";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

// ✅ Tipos Firestore (firebase)
import type { CollectionReference, Query } from "firebase/firestore";

export interface PublicGameStats {
  gameId?: string;         // idField
  ratingAvg: number;
  ratingCount: number;
  commentCount: number;
  updatedAt?: any;
}

export interface PublicComment {
  id?: string;             // idField
  gameId: number;
  gameTitle: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt?: any;
  updatedAt?: any;
}

@Component({
  selector: "app-comunidad",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./comunidad.page.html",
  styleUrl: "./comunidad.page.css",
})
export class ComunidadPage {
  private fs = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  topGames = signal<PublicGameStats[]>([]);
  recent = signal<PublicComment[]>([]);

  constructor() {
    // ✅ TOP (games_public)
    const topCol = collection(this.fs, "games_public") as CollectionReference<PublicGameStats>;
    const topQ = query(topCol, orderBy("commentCount", "desc"), limit(10));

    collectionData(topQ, { idField: "gameId" })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => this.topGames.set(list));

    // ✅ RECIENTES (collectionGroup comments)
    const recentBase = collectionGroup(this.fs, "comments") as Query<PublicComment>;
    const recentQ = query(recentBase, orderBy("createdAt", "desc"), limit(20));

    collectionData(recentQ, { idField: "id" })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => this.recent.set(list));
  }
}
