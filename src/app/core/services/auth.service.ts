import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  Auth,
  User,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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

  /** Foto de perfil (la de Google si inició sesión con Google) */
  photoURL = computed(() => this.user()?.photoURL ?? null);

  /** Nombre visible con respaldo en la parte local del email */
  displayName = computed(() => {
    const u = this.user();
    const dn = (u?.displayName ?? '').trim();
    if (dn) return dn;
    const email = String(u?.email ?? '').trim();
    return email ? email.split('@')[0] : 'Usuario';
  });

  /**
   * Proveedor con el que se autenticó: 'google' o 'password'.
   * Sirve para mostrar el origen de la cuenta y ocultar acciones que no
   * aplican (por ejemplo, verificar email en una cuenta de Google).
   */
  provider = computed<'google' | 'password' | null>(() => {
    const u = this.user();
    if (!u) return null;
    const ids = u.providerData.map(p => p.providerId);
    if (ids.includes('google.com')) return 'google';
    return 'password';
  });

  // ---------- Email + contraseña ----------
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

  // ---------- Google ----------
  /**
   * Inicia sesión con la cuenta de Google mediante ventana emergente.
   * Firebase trae automáticamente displayName, email y photoURL, y marca
   * el email como verificado (Google ya lo verificó).
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Fuerza el selector de cuenta: evita entrar siempre con la misma sesión
    provider.setCustomParameters({ prompt: 'select_account' });

    const cred = await signInWithPopup(this.auth, provider);
    return cred.user;
  }

  // ---------- Comunes ----------
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
