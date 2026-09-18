import { Injectable, computed, effect, signal } from '@angular/core';
import { AppNotification, NotificationKind } from '../models/notification';
import { STORAGE_KEYS } from '../constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private items = signal<AppNotification[]>([]);

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.notifications);
      if (raw) this.items.set(JSON.parse(raw));
    } catch {}
    effect(() => {
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(this.items()));
    });
  }

  all = computed(() => this.items().slice().sort((a, b) => b.createdAt - a.createdAt));
  unreadCount = computed(() => this.items().filter(n => !n.read).length);

  push(kind: NotificationKind, title: string, message?: string) {
    const n: AppNotification = {
      id: crypto.randomUUID(),
      kind, title, message,
      createdAt: Date.now(),
      read: false
    };
    this.items.set([n, ...this.items()]);
  }

  markRead(id: string) { this.items.set(this.items().map(n => n.id === id ? { ...n, read: true } : n)); }
  markAllRead() { this.items.set(this.items().map(n => ({ ...n, read: true }))); }
  remove(id: string) { this.items.set(this.items().filter(n => n.id !== id)); }
  clear() { this.items.set([]); }
}
