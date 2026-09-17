import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastStore } from '../../../core/services/toast.store';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stack" aria-live="polite" aria-atomic="true">
      <div
        class="toast"
        *ngFor="let t of items()"
        [attr.data-kind]="t.kind"
        (click)="remove(t.id)"
        role="status"
      >
        <div class="title">{{ t.title }}</div>
        <div class="msg" *ngIf="t.message">{{ t.message }}</div>
        <div class="hint">Click para cerrar</div>
      </div>
    </div>
  `,
  styles: [`
    .stack{
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9999;
      display: grid;
      gap: 10px;
      width: min(360px, calc(100vw - 28px));
      pointer-events: none;
    }

    .toast{
      pointer-events: auto;
      cursor: pointer;
      border-radius: 14px;
      padding: 12px;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
      color: var(--text);
      transition: transform .12s ease, border-color .12s ease;
      animation: toastIn .22s ease-out;
    }

    .toast:hover{ transform: translateY(-1px); border-color: var(--accent-soft); }

    @keyframes toastIn{
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .title{ font-weight: 800; margin-bottom: 2px; }
    .msg{ color: var(--text-2); font-size: .92rem; line-height: 1.3; }
    .hint{ margin-top: 8px; font-size: .78rem; color: var(--muted); }

    .toast[data-kind="success"]{ border-left: 3px solid var(--success); }
    .toast[data-kind="warning"]{ border-left: 3px solid var(--warning); }
    .toast[data-kind="error"]{ border-left: 3px solid var(--danger); }
    .toast[data-kind="info"]{ border-left: 3px solid var(--accent-2); }
  `],
})
export class ToastsComponent {
  private store = inject(ToastStore);
  items = computed(() => this.store.items());
  remove(id: string) { this.store.remove(id); }
}
