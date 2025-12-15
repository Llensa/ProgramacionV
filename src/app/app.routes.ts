import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'explorar', pathMatch: 'full' },

  {
    path: 'explorar',
    loadComponent: () =>
      import('./features/explorar/explorar.page').then((m) => m.ExplorarPage),
  },
  {
    path: 'juego/:id',
    loadComponent: () =>
      import('./features/detalle/detalle.page').then((m) => m.DetallePage),
  },

  {
    path: 'favoritos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favoritos/favoritos.page').then((m) => m.FavoritosPage),
  },
  {
    path: 'notificaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notificaciones/notificaciones.page').then((m) => m.NotificacionesPage),
  },

  {
    path: 'comunidad',
    loadComponent: () =>
      import('./features/comunidad/comunidad.page').then((m) => m.ComunidadPage),
  },

  {
    path: 'cuenta',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cuenta/cuenta.page').then((m) => m.CuentaPage),
  },

  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register.page').then((m) => m.RegisterPage),
  },

  // ✅ SIEMPRE AL FINAL
  {
    path: '**',
    loadComponent: () =>
      import('./shared/not-found.page').then((m) => m.NotFoundPage),
  },
];
