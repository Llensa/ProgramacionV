import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Auth, user, sendEmailVerification } from '@angular/fire/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ToastStore } from '../../core/services/toast.store';
import { UserProfileService, UserPrefs, NotifyFreq } from '../../core/services/user-profile.service';

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cuenta.page.html',
  styleUrl: './cuenta.page.css',
})
export class CuentaPage {
  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  private toast = inject(ToastStore);
  private profile = inject(UserProfileService);
  private destroyRef = inject(DestroyRef);

  me$ = user(this.auth);

  me = signal<any | null>(null);
  uid = computed(() => this.me()?.uid ?? null);
  email = computed(() => this.me()?.email ?? null);
  emailVerified = computed(() => !!this.me()?.emailVerified);

  busy = signal(false);
  nameStatus = signal<{ ok: boolean; text: string } | null>(null);

  form = this.fb.nonNullable.group({
    displayName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),

    emailNotifications: this.fb.nonNullable.control(true),
    notifyOnReplies: this.fb.nonNullable.control(true),
    notifyOnMentions: this.fb.nonNullable.control(true),
    frequency: this.fb.nonNullable.control<NotifyFreq>('instant'),
  });

  constructor() {
    this.me$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (u) => {
        this.me.set(u as any);

        const uid = u?.uid;
        if (!uid) return;

        const dn = (u?.displayName ?? '').trim() || (u?.email?.split('@')[0] ?? '');

        try {
          const prefs = await this.profile.loadPrefs(uid);
          this.form.patchValue({ displayName: dn, ...prefs });
        } catch {
          this.form.patchValue({ displayName: dn });
        }
      });
  }

  async refreshUser() {
    const u = this.auth.currentUser;
    if (!u) return;

    this.busy.set(true);
    try {
      await u.reload();
      this.toast.show('success', 'Listo', 'Datos actualizados.');
    } finally {
      this.busy.set(false);
    }
  }

  async resendVerification() {
    const u = this.auth.currentUser;
    if (!u) return;

    this.busy.set(true);
    try {
      await sendEmailVerification(u); // ✅ así es en modular
      this.toast.show('success', 'Enviado', 'Te mandé el mail de verificación.');
    } catch {
      this.toast.show('error', 'Error', 'No se pudo enviar el email.');
    } finally {
      this.busy.set(false);
    }
  }

  async onCheckName() {
    const uid = this.uid();
    if (!uid) return;

    const name = this.form.getRawValue().displayName;

    this.busy.set(true);
    this.nameStatus.set(null);
    try {
      const r = await this.profile.checkNameAvailable(uid, name);
      this.nameStatus.set({
        ok: r.ok,
        text: r.ok ? 'Disponible ✅' : (r.reason || 'No disponible ❌'),
      });
    } finally {
      this.busy.set(false);
    }
  }

  async saveProfile() {
    const uid = this.uid();
    if (!uid) return;

    if (this.form.invalid) {
      this.toast.show('warning', 'Revisá', 'Nombre inválido.');
      return;
    }

    const v = this.form.getRawValue();

    this.busy.set(true);
    this.nameStatus.set(null);

    try {
      await this.profile.setDisplayName(uid, v.displayName);

      const prefs: UserPrefs = {
        emailNotifications: v.emailNotifications,
        notifyOnReplies: v.notifyOnReplies,
        notifyOnMentions: v.notifyOnMentions,
        frequency: v.frequency,
      };

      await this.profile.savePrefs(uid, prefs);

      this.toast.show('success', 'Guardado', 'Perfil y preferencias actualizadas.');
      this.nameStatus.set({ ok: true, text: 'Guardado ✅' });
    } catch (e: any) {
      const msg = String(e?.message || 'No se pudo guardar.');
      this.toast.show('error', 'Error', msg);
      this.nameStatus.set({ ok: false, text: msg });
    } finally {
      this.busy.set(false);
    }
  }
}
