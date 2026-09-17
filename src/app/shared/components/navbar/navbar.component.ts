import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationsStore } from '../../../core/services/notifications.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private themeSvc = inject(ThemeService);
  private notifs = inject(NotificationsStore);

  user = computed(() => this.auth.user() as any);
  emailVerified = computed(() => !!this.user()?.emailVerified);
  isLogged = computed(() => !!this.user());

  /** Contador de notificaciones sin leer, para el globito del menú */
  unread = this.notifs.unreadCount;

  isDark = this.themeSvc.isDark;

  /** Nombre visible; si no hay, la parte del email antes del @ */
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

  toggleTheme() {
    this.themeSvc.toggle();
  }

  logout() {
    this.auth.logout();
  }
}
