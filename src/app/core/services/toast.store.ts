import { Injectable, signal } from '@angular/core';

import { ToastItem, ToastKind } from '../models/toast';

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private itemsSig = signal<ToastItem[]>([]);
  items = this.itemsSig.asReadonly();

  show(kind: ToastKind, title: string, message?: string, ttlMs = 2800) {
    const id = crypto.randomUUID();
    const t: ToastItem = { id, kind, title, message, createdAt: Date.now(), ttlMs };
    this.itemsSig.set([t, ...this.itemsSig()]);

    window.setTimeout(() => this.remove(id), ttlMs);
  }

  remove(id: string) {
    this.itemsSig.set(this.itemsSig().filter(x => x.id !== id));
  }

  clear() {
    this.itemsSig.set([]);
  }
}
