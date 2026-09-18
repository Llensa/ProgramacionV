import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { ToastStore } from '../../core/services/toast.store';
import { FavoritesService } from '../../core/services/favorites.service';
import { CommunityService } from '../../core/services/community.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { GameCommentDoc } from '../../core/models/community';
import { NotifyFreq, UserPrefs } from '../../core/models/user-profile';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent],
  templateUrl: './cuenta.page.html',
  styleUrl: './cuenta.page.css',
})
export class CuentaPage {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastStore);
  private profile = inject(UserProfileService);
  private favs = inject(FavoritesService);
  private community = inject(CommunityService);
  private destroyRef = inject(DestroyRef);

  me$ = this.auth.user$;

  // Una sola fuente de verdad: las señales del servicio. Mantener una copia
  // local hacía que el navbar y esta página mostraran estados distintos.
  me = this.auth.user;
  uid = computed(() => this.me()?.uid ?? null);
  email = computed(() => this.me()?.email ?? null);
  emailVerified = computed(() => !!this.me()?.emailVerified);
  photoURL = this.auth.photoURL;

  /** Nombre YA guardado: la portada no debe cambiar mientras se escribe */
  savedName = this.auth.displayName;

  /** 'google' o 'password': cambia qué acciones tienen sentido mostrar */
  provider = this.auth.provider;
  isGoogle = computed(() => this.provider() === 'google');

  /** Fecha de alta que reporta Firebase Auth */
  memberSince = computed(() => {
    const t = this.me()?.metadata?.creationTime;
    return t ? new Date(t) : null;
  });

  // ---------- Estadísticas del usuario ----------
  favCount = this.favs.total;

  private myComments = toSignal(
    this.me$.pipe(
      switchMap(u => (u ? this.community.watchMyComments(u.uid, 50) : of([] as GameCommentDoc[])))
    ),
    { initialValue: [] as GameCommentDoc[] }
  );

  commentCount = computed(() => this.myComments().length);

  busy = signal(false);
  nameStatus = signal<{ ok: boolean; text: string } | null>(null);
  copied = signal(false);

  form = this.fb.nonNullable.group({
    displayName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(20),
    ]),

    emailNotifications: this.fb.nonNullable.control(true),
    notifyOnReplies: this.fb.nonNullable.control(true),
    notifyOnMentions: this.fb.nonNullable.control(true),
    frequency: this.fb.nonNullable.control<NotifyFreq>('instant'),
  });

  /**
   * Con detección de cambios sin Zone.js, el template solo reacciona a
   * señales. El valor de un FormControl no lo es. Además `valueChanges` no
   * emite en los patchValue programáticos, así que mantenemos la señal a
   * mano: se actualiza al tipear y también al cargar el perfil.
   */
  private nameSig = signal('');
  displayNameValue = this.nameSig.asReadonly();
  nameLength = computed(() => this.nameSig().length);

  constructor() {
    this.form.controls.displayName.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nameSig.set(v ?? ''));

    this.me$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async u => {
      const uid = u?.uid;
      if (!uid) return;

      const dn = (u?.displayName ?? '').trim() || (u?.email?.split('@')[0] ?? '');

      try {
        const prefs = await this.profile.loadPrefs(uid);
        queueMicrotask(() => {
          this.form.patchValue({ displayName: dn, ...prefs });
          this.nameSig.set(dn);
        });
      } catch {
        queueMicrotask(() => {
          this.form.patchValue({ displayName: dn });
          this.nameSig.set(dn);
        });
      }
    });
  }

  async refreshUser() {
    if (!this.auth.currentUser) return;

    this.busy.set(true);
    try {
      await this.auth.refreshUser();
      this.toast.show('success', 'Listo', 'Datos actualizados.');
    } catch {
      this.toast.show('error', 'Error', 'No se pudieron actualizar los datos.');
    } finally {
      this.busy.set(false);
    }
  }

  async resendVerification() {
    if (!this.auth.currentUser) return;

    this.busy.set(true);
    try {
      await this.auth.resendVerification();
      this.toast.show('success', 'Enviado', 'Te mandé el mail de verificación.');
    } catch {
      this.toast.show('error', 'Error', 'No se pudo enviar el email.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Copia el UID al portapapeles (útil para soporte o depuración) */
  async copyUid() {
    const id = this.uid();
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      this.toast.show('warning', 'No se pudo copiar', 'Copialo manualmente.');
    }
  }

  async onCheckName() {
    const uid = this.uid();
    if (!uid) return;

    // El (blur) se dispara aunque el campo esté vacío o sea muy corto.
    // Consultar con un nombre inválido генera una ruta `usernames/` sin
    // documento, que Firestore rechaza con permission-denied.
    if (this.form.controls.displayName.invalid) {
      this.nameStatus.set(null);
      return;
    }

    const name = this.form.getRawValue().displayName;

    this.busy.set(true);
    this.nameStatus.set(null);
    try {
      const r = await this.profile.checkNameAvailable(uid, name);
      this.nameStatus.set({
        ok: r.ok,
        text: r.ok ? 'Disponible' : r.reason || 'No disponible',
      });
    } catch {
      this.nameStatus.set({ ok: false, text: 'No se pudo verificar el nombre.' });
    } finally {
      this.busy.set(false);
    }
  }

  async saveProfile() {
    const uid = this.uid();
    if (!uid) return;

    if (this.form.invalid) {
      this.toast.show('warning', 'Revisá', 'El nombre visible no es válido.');
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

      // Propaga el nombre nuevo al navbar y al resto de la app
      await this.auth.syncProfile();

      this.toast.show('success', 'Guardado', 'Perfil y preferencias actualizadas.');
      this.nameStatus.set({ ok: true, text: 'Guardado' });
    } catch (e: any) {
      const msg = String(e?.message || 'No se pudo guardar.');
      this.toast.show('error', 'Error', msg);
      this.nameStatus.set({ ok: false, text: msg });
    } finally {
      this.busy.set(false);
    }
  }
}
