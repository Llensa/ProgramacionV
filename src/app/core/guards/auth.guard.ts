import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // authState() emite recién cuando Firebase terminó de restaurar la sesión
  // persistida. Devolver un Observable hace que el Router espere esa primera
  // emisión real, en lugar de leer un signal que todavía vale null.
  return authState(auth).pipe(
    take(1),
    map(user =>
      user
        ? true
        : router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url, reason: 'auth' },
        })
    )
  );
};
