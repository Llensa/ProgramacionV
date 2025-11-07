import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <section class="page">
      <h1>404</h1>
      <p class="muted">La ruta no existe.</p>
    </section>
  `
})
export class NotFoundPage {}
