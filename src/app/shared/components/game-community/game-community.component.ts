import { CommonModule } from '@angular/common';
import { Component, Input, signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  CommunityService,
  GameCommentDoc,
  GamePublicDoc,
  GameRatingDoc
} from '../../../core/services/community.service';

@Component({
  selector: 'app-game-community',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-community.component.html',
  styleUrl: './game-community.component.css',
})
export class GameCommunityComponent {
  private auth = inject(Auth);
  private community = inject(CommunityService);

  private gameIdSig = signal<number | null>(null);

  @Input({ required: true })
  set gameId(v: number) {
    const n = Number(v);
    this.gameIdSig.set(Number.isFinite(n) ? n : null);
  }

  @Input() gameTitle = '';
  @Input() gameThumb = '';

  private me$ = user(this.auth);

  me = toSignal(this.me$, { initialValue: null });
  uid = computed(() => this.me()?.uid ?? null);
  emailVerified = computed(() => !!this.me()?.emailVerified);
  displayName = computed(() => this.me()?.displayName || this.me()?.email || 'Usuario');

  // ✅ ESTE te faltaba (tu HTML usa gamePublic())
  gamePublic = toSignal<GamePublicDoc | null>(
    toObservable(this.gameIdSig).pipe(
      switchMap(id => (id ? this.community.watchGamePublic(id) : of(null)))
    ),
    { initialValue: null }
  );

  comments = toSignal(
    toObservable(this.gameIdSig).pipe(
      switchMap(id => (id ? this.community.watchComments(id, 30) : of([] as GameCommentDoc[])))
    ),
    { initialValue: [] as GameCommentDoc[] }
  );

  myRating = toSignal<GameRatingDoc | null>(
    combineLatest([this.me$, toObservable(this.gameIdSig)]).pipe(
      switchMap(([u, id]) => (u && id) ? this.community.watchMyRating(id, u.uid) : of(null))
    ),
    { initialValue: null }
  );

  // UI state
  commentText = signal('');
  busy = signal(false);
  err = signal<string | null>(null);

  editId = signal<string | null>(null);
  editText = signal('');

  stars = [1, 2, 3, 4, 5];

  async rate(v: number) {
    const uid = this.uid();
    const id = this.gameIdSig();

    this.err.set(null);
    if (!id) { this.err.set('Juego inválido.'); return; }
    if (!uid) { this.err.set('Tenés que iniciar sesión para calificar.'); return; }
    if (!this.emailVerified()) { this.err.set('Verificá tu email para calificar.'); return; }

    this.busy.set(true);
    try {
      await this.community.setRating(id, uid, v, { gameTitle: this.gameTitle, gameThumb: this.gameThumb });
    } catch (e: any) {
      this.err.set(e?.message || 'No se pudo guardar el rating.');
    } finally {
      this.busy.set(false);
    }
  }

  async sendComment() {
    const uid = this.uid();
    const id = this.gameIdSig();
    const text = this.commentText();

    this.err.set(null);
    if (!id) { this.err.set('Juego inválido.'); return; }
    if (!uid) { this.err.set('Tenés que iniciar sesión para comentar.'); return; }
    if (!this.emailVerified()) { this.err.set('Verificá tu email para comentar.'); return; }

    this.busy.set(true);
    try {
      await this.community.addComment({
        gameId: id,
        gameTitle: this.gameTitle,
        gameThumb: this.gameThumb,
        uid,
        displayName: this.displayName(),
        text
      });
      this.commentText.set('');
    } catch (e: any) {
      this.err.set(e?.message || 'No se pudo publicar el comentario.');
    } finally {
      this.busy.set(false);
    }
  }

  startEdit(c: GameCommentDoc) {
    this.editId.set(c.id || null);
    this.editText.set(c.text || '');
  }

  cancelEdit() {
    this.editId.set(null);
    this.editText.set('');
  }

  async saveEdit(gameId?: number) {
    const id = this.editId();
    const text = this.editText();
    const gid = gameId ?? this.gameIdSig();

    if (!gid || !id) return;

    this.busy.set(true);
    this.err.set(null);
    try {
      await this.community.updateComment(gid, id, text);
      this.cancelEdit();
    } catch (e: any) {
      this.err.set(e?.message || 'No se pudo editar el comentario.');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(gameId?: number, commentId?: string) {
    const gid = gameId ?? this.gameIdSig();
    if (!gid || !commentId) return;

    this.busy.set(true);
    this.err.set(null);
    try {
      await this.community.deleteComment(gid, commentId);
    } catch (e: any) {
      this.err.set(e?.message || 'No se pudo borrar el comentario.');
    } finally {
      this.busy.set(false);
    }
  }
}
