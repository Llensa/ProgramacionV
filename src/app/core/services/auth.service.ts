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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Signal tipada (User | null)
  user = toSignal(authState(this.auth), { initialValue: null as User | null });

  isLoggedIn = computed(() => !!this.user());
  isVerified = computed(() => !!this.user()?.emailVerified);

  async register(email: string, password: string, displayName?: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }

    // ✅ manda email real
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
}
