import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastStore } from '../services/toast.store';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastStore);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const code = err.status || 0;

        // Mensaje corto y útil
        const msg =
          code === 0 ? 'No hay conexión o el servidor no responde.'
            : code === 401 ? 'No autorizado.'
              : code === 403 ? 'Acceso denegado.'
                : code === 404 ? 'No se encontró el recurso.'
                  : code >= 500 ? 'Error del servidor.'
                    : 'Error inesperado.';

        toast.show('error', `HTTP ${code}`, msg, 3500);
      } else {
        toast.show('error', 'Error', 'Ocurrió un error inesperado.', 3500);
      }

      return throwError(() => err);
    })
  );
};
