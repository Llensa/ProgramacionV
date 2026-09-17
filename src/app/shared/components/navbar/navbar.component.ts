import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationsStore } from '../../../core/services/notifications.store';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private themeSvc = inject(ThemeService);
  private notifs = inject(NotificationsStore);

  user = computed(() => this.auth.user() as any);
  emailVerified = computed(() => !!this.user()?.emailVerified);
  isLogged = this.auth.isLoggedIn;

  /** Nombre y foto vienen del servicio: una sola fuente de verdad */
  displayName = this.auth.displayName;
  photoURL = this.auth.photoURL;

  /** Contador de notificaciones sin leer, para el globito del menú */
  unread = this.notifs.unreadCount;

  isDark = this.themeSvc.isDark;

  toggleTheme() {
    this.themeSvc.toggle();
  }

  logout() {
    this.auth.logout();
  }
}
