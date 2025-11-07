import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `
    <section class="page">
      <h1>Crear cuenta</h1>
      <p class="muted">Registro con email y contraseña.</p>
    </section>
  `
})
export class RegisterPage {}
