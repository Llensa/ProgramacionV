import { Injectable, inject } from '@angular/core';
import { Auth, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { runTransaction, serverTimestamp } from 'firebase/firestore';

export type NotifyFreq = 'instant' | 'daily' | 'weekly';

export interface UserPrefs {
  emailNotifications: boolean;
  notifyOnReplies: boolean;
  notifyOnMentions: boolean;
  frequency: NotifyFreq;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private auth = inject(Auth);
  private fs = inject(Firestore);

  private normName(name: string) {
    return (name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}_ .-]/gu, '');
  }

  async loadPrefs(uid: string): Promise<UserPrefs> {
    const ref = doc(this.fs, `users/${uid}`);
    const snap = await getDoc(ref);
    const data = snap.exists() ? (snap.data() as any) : {};
    return {
      emailNotifications: !!data?.prefs?.emailNotifications,
      notifyOnReplies: data?.prefs?.notifyOnReplies ?? true,
      notifyOnMentions: data?.prefs?.notifyOnMentions ?? true,
      frequency: (data?.prefs?.frequency ?? 'instant') as NotifyFreq,
    };
  }

  async savePrefs(uid: string, prefs: UserPrefs) {
    const userRef = doc(this.fs, `users/${uid}`);

    await runTransaction(this.fs as any, async (tx: any) => {
      tx.set(
        userRef as any,
        { prefs: { ...prefs, updatedAt: serverTimestamp() }, updatedAt: serverTimestamp() },
        { merge: true }
      );
    });
  }

  async checkNameAvailable(uid: string, displayName: string): Promise<{ ok: boolean; reason?: string }> {
    const normalized = this.normName(displayName);
    if (normalized.length < 2) return { ok: false, reason: 'Muy corto (mín 2).' };
    if (normalized.length > 20) return { ok: false, reason: 'Muy largo (máx 20).' };

    const key = normalized.replace(/\s/g, '_');
    const ref = doc(this.fs, `usernames/${key}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { ok: true };

    const owner = (snap.data() as any)?.uid;
    if (owner === uid) return { ok: true };
    return { ok: false, reason: 'Ese nombre ya está en uso.' };
  }

  async setDisplayName(uid: string, displayName: string) {
    const u = this.auth.currentUser;
    if (!u || u.uid !== uid) throw new Error('No autenticado.');

    const normalized = this.normName(displayName);
    const key = normalized.replace(/\s/g, '_');

    const usernameRef = doc(this.fs, `usernames/${key}`);
    const userRef = doc(this.fs, `users/${uid}`);

    await runTransaction(this.fs as any, async (tx: any) => {
      const usernameSnap = await tx.get(usernameRef as any);
      if (usernameSnap.exists()) {
        const owner = usernameSnap.data()?.uid;
        if (owner !== uid) throw new Error('Ese nombre ya está en uso.');
      }

      tx.set(usernameRef as any, { uid, displayName: normalized, updatedAt: serverTimestamp() }, { merge: true });
      tx.set(
        userRef as any,
        { displayName: normalized, displayNameKey: key, updatedAt: serverTimestamp() },
        { merge: true }
      );
    });

    // ✅ updateProfile viene de @angular/fire/auth (o firebase/auth), NO firestore
    await updateProfile(u, { displayName: normalized });
  }
}
