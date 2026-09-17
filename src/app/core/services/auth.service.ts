import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  Auth,
  User,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from '@angular/fire/auth';

import { reload } from 'firebase/auth';

/**
 * Única puerta de entrada a Firebase Authentication.
 * Ningún componente importa `Auth` directamente: todos pasan por acá.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  /** Stream del estado de sesión (para componentes y servicios reactivos) */
  readonly user$ = authState(this.auth);

  /** Señal tipada del usuario actual */
  user = toSignal(this.user$, { initialValue: null as User | null });

  /** Usuario actual de forma sincrónica (null si no hay sesión) */
  get currentUser() {
    return this.auth.currentUser;
  }

  isLoggedIn = computed(() => !!this.user());
  isVerified = computed(() => !!this.user()?.emailVerified);

  async register(email: string, password: string, displayName?: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }

    await sendEmailVerification(cred.user);
    return cred.user;
  }

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async logout() {
    await signOut(this.auth);
  }

  async resendVerification() {
    const u = this.auth.currentUser;
    if (!u) return;
    await sendEmailVerification(u);
  }

  async resetPassword(email: string) {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Recarga el usuario desde Firebase.
   * `reload` actualiza emailVerified; `getIdToken(true)` fuerza un token nuevo
   * para que las reglas de Firestore vean el claim email_verified actualizado.
   */
  async refreshUser() {
    const u = this.auth.currentUser;
    if (!u) return;
    await reload(u);
    await u.getIdToken(true);
  }
}
