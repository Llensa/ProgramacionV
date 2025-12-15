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
  styleUrl: './login.page.css', // ✅ reutiliza tu CSS (mismo estilo)
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastStore);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  async onSubmit() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { name, email, password } = this.form.getRawValue();

    try {
      await this.auth.register(email, password, name);
      this.toast.show('success', 'Cuenta creada', 'Ya podés usar Favoritos.');
      await this.router.navigateByUrl('/explorar');
    } catch (e: any) {
      const msg =
        e?.code === 'auth/email-already-in-use' ? 'Ese email ya está registrado.'
          : 'No se pudo crear la cuenta.';
      this.error.set(msg);
      this.toast.show('error', 'Registro falló', msg);
    } finally {
      this.loading.set(false);
    }
  }
}
