import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastsComponent } from './shared/components/toasts/toasts.component';
import { AuthService } from './core/services/auth.service';
import { PROTECTED_ROUTES } from './core/constants/protected-routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Los guards solo corren al navegar. Si la sesión se cierra estando
    // parado en una ruta protegida, hay que sacar al usuario de ahí.
    effect(() => {
      const logged = this.auth.isLoggedIn();
      if (logged) return;

      const url = this.router.url.split('?')[0];
      if (PROTECTED_ROUTES.some(p => url.startsWith(p))) {
        this.router.navigateByUrl('/explorar');
      }
    });
  }
}
