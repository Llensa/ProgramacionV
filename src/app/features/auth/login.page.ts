import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';
import { ToastStore } from '../../core/services/toast.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  error = signal<string | null>(null);
  returnUrl = signal<string>('/explorar');

  form = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qp => {
      const ru = qp.get('returnUrl');
      if (ru) this.returnUrl.set(ru);

      const reason = qp.get('reason');
      if (reason === 'auth') {
        this.toast.show('warning', 'Acceso restringido', 'Tenés que iniciar sesión para entrar.');
      }
    });
  }

  async onSubmit() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login(email, password);
      this.toast.show('success', 'Bienvenido', 'Sesión iniciada.');
      await this.router.navigateByUrl(this.returnUrl());
    } catch (e: any) {
      const msg =
        e?.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos.'
          : e?.code === 'auth/too-many-requests' ? 'Demasiados intentos. Probá más tarde.'
            : 'No se pudo iniciar sesión.';
      this.error.set(msg);
      this.toast.show('error', 'Login falló', msg);
    } finally {
      this.loading.set(false);
    }
  }

  async onResetPassword() {
    const email = this.form.get('email')?.value?.trim();
    if (!email) {
      this.toast.show('info', 'Falta email', 'Escribí tu email y tocá “Olvidé mi contraseña”.');
      return;
    }

    try {
      await this.auth.resetPassword(email);
      this.toast.show('success', 'Listo', 'Te mandé un email para recuperar la contraseña.');
    } catch {
      this.toast.show('error', 'Error', 'No se pudo enviar el email de recuperación.');
    }
  }
}
