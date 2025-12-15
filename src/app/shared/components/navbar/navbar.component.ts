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

  user = computed(() => this.auth.user() as any);
  emailVerified = computed(() => !!this.user()?.emailVerified);

  // ✅ nombre visible primero (displayName). Fallback: parte antes del @
  displayName = computed(() => {
    const u = this.user();
    const dn = (u?.displayName ?? '').trim();
    if (dn) return dn;
    const email = String(u?.email ?? '').trim();
    if (!email) return 'Usuario';
    return email.split('@')[0] || 'Usuario';
  });

  initial = computed(() => {
    const n = this.displayName();
    return n ? n.trim()[0]?.toUpperCase() : '👤';
  });

  isLogged = computed(() => !!this.user());

  logout() {
    this.auth.logout();
  }
}
