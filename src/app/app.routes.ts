import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
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
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register.page').then((m) => m.RegisterPage),
  },

  // si o si va al final
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
