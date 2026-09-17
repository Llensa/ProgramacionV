import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastStore } from '../../core/services/toast.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './login.page.css', // reutiliza el mismo sistema visual
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastStore);
  private router = inject(Router);

  loading = signal(false);
  googleLoading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { name, email, password } = this.form.getRawValue();

    try {
      await this.auth.register(email, password, name);
      this.toast.show('success', 'Cuenta creada', 'Revisá tu email para verificarla.');
      await this.router.navigateByUrl('/explorar');
    } catch (e: any) {
      const msg =
        e?.code === 'auth/email-already-in-use' ? 'Ese email ya está registrado.'
          : e?.code === 'auth/weak-password' ? 'La contraseña es demasiado débil.'
            : 'No se pudo crear la cuenta.';
      this.error.set(msg);
      this.toast.show('error', 'Registro falló', msg);
    } finally {
      this.loading.set(false);
    }
  }

  /** Con Google no hace falta verificar el email: ya viene verificado */
  async onGoogle() {
    if (this.googleLoading()) return;

    this.googleLoading.set(true);
    this.error.set(null);

    try {
      await this.auth.loginWithGoogle();
      this.toast.show('success', 'Listo', 'Tu cuenta de Google quedó vinculada.');
      await this.router.navigateByUrl('/explorar');
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
        return;
      }
      const msg =
        e?.code === 'auth/popup-blocked'
          ? 'El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.'
          : 'No se pudo continuar con Google.';
      this.error.set(msg);
      this.toast.show('error', 'Google', msg);
    } finally {
      this.googleLoading.set(false);
    }
  }
}
