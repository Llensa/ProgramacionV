import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  collectionGroup,
  doc,
  docData,
  query,
  where,
  orderBy,
  limit,
} from '@angular/fire/firestore';

import {
  addDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GamePublicDoc {
  gameId?: number;
  gameTitle?: string;
  gameThumb?: string;
  ratingAvg?: number;
  ratingCount?: number;
  commentCount?: number;
  updatedAt?: any;
}

export interface GameCommentDoc {
  id?: string;
  gameId?: number;
  gameTitle?: string;
  gameThumb?: string;
  uid?: string;
  displayName?: string;
  text?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GameRatingDoc {
  value?: number; // 1..5
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private fs = inject(Firestore);

  // ---------- READS ----------
  watchGamePublic(gameId: number): Observable<GamePublicDoc | null> {
    const ref = doc(this.fs, `games_public/${gameId}`);
    return docData(ref).pipe(
      map(d => (d ? ({ gameId, ...(d as any) } as GamePublicDoc) : null))
    );
  }

  watchComments(gameId: number, take = 25): Observable<GameCommentDoc[]> {
    const colRef = collection(this.fs, `games_public/${gameId}/comments`);
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(take));
    return collectionData(q, { idField: 'id' }).pipe(
      map(arr => (arr as any[]).map(x => ({ gameId, ...(x as any) } as GameCommentDoc)))
    );
  }

  watchMyRating(gameId: number, uid: string): Observable<GameRatingDoc | null> {
    const ref = doc(this.fs, `games_public/${gameId}/ratings/${uid}`);
    return docData(ref).pipe(
      map(d => (d ? ({ ...(d as any) } as GameRatingDoc) : null))
    );
  }

  watchTopGames(take = 10): Observable<GamePublicDoc[]> {
    const colRef = collection(this.fs, `games_public`);
    const q = query(colRef, orderBy('commentCount', 'desc'), limit(take));
    return collectionData(q).pipe(map(arr => arr as unknown as GamePublicDoc[]));
  }

  watchRecentComments(take = 20): Observable<GameCommentDoc[]> {
    const q = query(
      collectionGroup(this.fs, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(take)
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map(arr => arr as unknown as GameCommentDoc[])
    );
  }

  watchMyComments(uid: string, take = 20): Observable<GameCommentDoc[]> {
    const q = query(
      collectionGroup(this.fs, 'comments'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(take)
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map(arr => arr as unknown as GameCommentDoc[])
    );
  }

  // ---------- WRITES (CRUD) ----------
  async addComment(input: {
    gameId: number;
    gameTitle?: string;
    gameThumb?: string;
    uid: string;
    displayName: string;
    text: string;
  }) {
    const text = (input.text ?? '').trim();
    if (text.length < 3 || text.length > 500) throw new Error('Comentario inválido (3..500).');

    const pubRef = doc(this.fs, `games_public/${input.gameId}`);
    const commentsCol = collection(this.fs, `games_public/${input.gameId}/comments`);

    await addDoc(commentsCol as any, {
      gameId: input.gameId,
      gameTitle: input.gameTitle ?? '',
      gameThumb: input.gameThumb ?? '',
      uid: input.uid,
      displayName: input.displayName,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      pubRef as any,
      {
        gameId: input.gameId,
        gameTitle: input.gameTitle ?? '',
        gameThumb: input.gameThumb ?? '',
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async updateComment(gameId: number, commentId: string, text: string) {
    const t = (text ?? '').trim();
    if (t.length < 3 || t.length > 500) throw new Error('Comentario inválido (3..500).');
    const ref = doc(this.fs, `games_public/${gameId}/comments/${commentId}`);
    await updateDoc(ref as any, { text: t, updatedAt: serverTimestamp() });
    await setDoc(doc(this.fs, `games_public/${gameId}`) as any, { updatedAt: serverTimestamp() }, { merge: true });
  }

  async deleteComment(gameId: number, commentId: string) {
    await deleteDoc(doc(this.fs, `games_public/${gameId}/comments/${commentId}`) as any);
    await setDoc(
      doc(this.fs, `games_public/${gameId}`) as any,
      { commentCount: increment(-1), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async setRating(
    gameId: number,
    uid: string,
    value: number,
    meta?: { gameTitle?: string; gameThumb?: string }
  ) {
    const v = Number(value);
    if (!(v >= 1 && v <= 5)) throw new Error('Rating inválido (1..5).');

    const pubRef = doc(this.fs, `games_public/${gameId}`);
    const ratingRef = doc(this.fs, `games_public/${gameId}/ratings/${uid}`);

    await runTransaction(this.fs as any, async (tx: any) => {
      const pubSnap = await tx.get(pubRef as any);
      const ratingSnap = await tx.get(ratingRef as any);

      const pub = (pubSnap.exists() ? pubSnap.data() : {}) as any;
      const avg = Number(pub.ratingAvg ?? 0);
      const count = Number(pub.ratingCount ?? 0);

      let newAvg = avg;
      let newCount = count;

      if (ratingSnap.exists()) {
        const old = Number(ratingSnap.data()?.value ?? 0);
        newAvg = count > 0 ? (avg * count - old + v) / count : v;
      } else {
        newCount = count + 1;
        newAvg = (avg * count + v) / newCount;
      }

      newAvg = Math.round(newAvg * 100) / 100;

      tx.set(
        ratingRef as any,
        {
          value: v,
          createdAt: ratingSnap.exists() ? ratingSnap.data()?.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        pubRef as any,
        {
          gameId,
          gameTitle: meta?.gameTitle ?? pub.gameTitle ?? '',
          gameThumb: meta?.gameThumb ?? pub.gameThumb ?? '',
          ratingAvg: newAvg,
          ratingCount: newCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  }
}
