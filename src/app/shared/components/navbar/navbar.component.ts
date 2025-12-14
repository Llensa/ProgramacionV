import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private auth = inject(AuthService);

  user = computed(() => this.auth.user() as any); // (any) para no pelear con tipos ahora
  email = computed(() => this.user()?.email ?? null);
  emailVerified = computed(() => !!this.user()?.emailVerified);

  initial = computed(() => {
    const e = this.email();
    return e ? e.trim()[0]?.toUpperCase() : '👤';
  });

  logout() {
    this.auth.logout();
  }
}
