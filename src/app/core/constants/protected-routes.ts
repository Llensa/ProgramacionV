/**
 * Rutas que exigen sesion iniciada.
 *
 * Las usa el efecto global de `app.component.ts` para redirigir al login
 * cuando el usuario cierra sesion estando parado en una de ellas. Tienen
 * que coincidir con las rutas que declaran `canActivate: [authGuard]` en
 * `app.routes.ts`.
 */
export const PROTECTED_ROUTES = ['/favoritos', '/notificaciones', '/cuenta'] as const;
