import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <section class="page">
      <h1>Ingresar</h1>
      <p class="muted">Formulario de email y contraseña (Auth).</p>
    </section>
  `
})
export class LoginPage {}
