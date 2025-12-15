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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Signal tipada (User | null)
  user = toSignal(authState(this.auth), { initialValue: null as User | null });

  isLoggedIn = computed(() => !!this.user());
  isVerified = computed(() => !!this.user()?.emailVerified);

  // ✅ OJO: este orden (email, password, displayName) es el que venías usando vos
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

  // ✅ helpers para la página Cuenta
  async refreshUser() {
    const u = this.auth.currentUser;
    if (!u) return;
    await reload(u);             // actualiza emailVerified en el user
    await u.getIdToken(true);    // ✅ fuerza token nuevo con email_verified
  }


  async setDisplayName(name: string) {
    const u = this.auth.currentUser;
    if (!u) return;
    await updateProfile(u, { displayName: name.trim() });
    await this.refreshUser();
  }
}
