import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AvatarComponent } from '../avatar/avatar.component';
import {
  CommunityService,
  GameCommentDoc,
  GamePublicDoc,
  GameRatingDoc,
} from '../../../core/services/community.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsStore } from '../../../core/services/notifications.store';

@Component({
  selector: 'app-game-community',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './game-community.component.html',
  styleUrl: './game-community.component.css',
})
export class GameCommunityComponent {
  // El componente habla con AuthService, no con Firebase Auth directamente.
  private auth = inject(AuthService);
  private community = inject(CommunityService);
  private notifs = inject(NotificationsStore);

  private gameIdSig = signal<number | null>(null);

  @Input({ required: true })
  set gameId(v: number) {
    const n = Number(v);
    this.gameIdSig.set(Number.isFinite(n) ? n : null);
  }

  @Input() gameTitle = '';
  @Input() gameThumb = '';

  private me$ = this.auth.user$;

  me = this.auth.user;
  uid = computed(() => this.me()?.uid ?? null);
  emailVerified = computed(() => !!this.me()?.emailVerified);
  displayName = this.auth.displayName;
  photoURL = this.auth.photoURL;

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
      switchMap(([u, id]) => (u && id ? this.community.watchMyRating(id, u.uid) : of(null)))
    ),
    { initialValue: null }
  );

  // ---------- Estado de UI ----------
  commentText = signal('');
  busy = signal(false);
  err = signal<string | null>(null);

  editId = signal<string | null>(null);
  editText = signal('');

  stars = [1, 2, 3, 4, 5];

  /** Validación en vivo del comentario, antes de llegar a Firestore */
  commentValid = computed(() => {
    const n = this.commentText().trim().length;
    return n >= 3 && n <= 500;
  });

  canPublish = computed(() => !!this.uid() && this.emailVerified() && this.commentValid());

  // ---------- Acciones ----------
  async rate(v: number) {
    const uid = this.uid();
    const id = this.gameIdSig();

    this.err.set(null);
    if (!id) { this.err.set('Juego inválido.'); return; }
    if (!uid) { this.err.set('Tenés que iniciar sesión para calificar.'); return; }
    if (!this.emailVerified()) { this.err.set('Verificá tu email para calificar.'); return; }

    this.busy.set(true);
    try {
      await this.community.setRating(id, uid, v, {
        gameTitle: this.gameTitle,
        gameThumb: this.gameThumb,
      });
      this.notifs.push('info', 'Calificación guardada', `${v}/5 · ${this.gameTitle}`);
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
    if (!this.commentValid()) { this.err.set('El comentario debe tener entre 3 y 500 caracteres.'); return; }

    this.busy.set(true);
    try {
      await this.community.addComment({
        gameId: id,
        gameTitle: this.gameTitle,
        gameThumb: this.gameThumb,
        uid,
        displayName: this.displayName(),
        photoURL: this.photoURL() ?? '',
        text,
      });
      this.commentText.set('');
      this.notifs.push('success', 'Comentario publicado', this.gameTitle);
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
      this.notifs.push('success', 'Comentario actualizado', this.gameTitle);
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
      this.notifs.push('warning', 'Comentario eliminado', this.gameTitle);
    } catch (e: any) {
      this.err.set(e?.message || 'No se pudo borrar el comentario.');
    } finally {
      this.busy.set(false);
    }
  }
}
