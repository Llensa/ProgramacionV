import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <div class="brand"> 🎮YenzaPlayG</div>

      <nav class="nav">
        <a
          routerLink="/explorar"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Explorar
        </a>

        <a routerLink="/favoritos" routerLinkActive="active">Favoritos</a>
        <a routerLink="/notificaciones" routerLinkActive="active">Notificaciones</a>
      </nav>

      <nav class="auth">
        <a routerLink="/auth/login" routerLinkActive="active">Ingresar</a>
        <a routerLink="/auth/register" class="btn-primary">Crear cuenta</a>
      </nav>
    </header>
  `,
})
export class NavbarComponent {}
