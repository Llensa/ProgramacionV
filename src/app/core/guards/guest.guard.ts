import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

/**
 * Inverso de authGuard: impide entrar al login o al registro cuando ya hay
 * sesion iniciada. Sin esto, escribiendo /auth/login en la barra de
 * direcciones un usuario logueado llega a un formulario que no deberia ver.
 *
 * Igual que el otro guard, devuelve un Observable para que el Router espere
 * a que Firebase termine de restaurar la sesion persistida.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => (user ? router.createUrlTree(['/explorar']) : true))
  );
};
