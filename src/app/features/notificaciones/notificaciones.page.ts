import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsStore } from '../../core/services/notifications.store';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.page.html',
  styleUrl: './notificaciones.page.css',
})
export class NotificacionesPage {
  private store = inject(NotificationsStore);

  items = this.store.all;
  unread = this.store.unreadCount;

  hasItems = computed(() => this.items().length > 0);

  /** Etiquetas en español: el store guarda la clave técnica en inglés */
  private readonly kindLabels: Record<string, string> = {
    info: 'Información',
    success: 'Listo',
    warning: 'Atención',
    error: 'Error',
  };

  label(kind: string): string {
    return this.kindLabels[kind] ?? kind;
  }

  markAllRead() { this.store.markAllRead(); }
  markRead(id: string) { this.store.markRead(id); }
  remove(id: string) { this.store.remove(id); }
  clear() { this.store.clear(); }
}
