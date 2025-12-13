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
      padding: 12px 12px;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(12, 14, 20, .92);
      box-shadow: 0 14px 40px rgba(0,0,0,.45);
      backdrop-filter: blur(8px);
      color: #e6e6f0;
      transform: translateY(0);
      transition: transform .12s ease, border-color .12s ease;
    }
    .toast:hover{ transform: translateY(-1px); border-color: rgba(164,112,255,.35); }

    .title{ font-weight: 800; margin-bottom: 2px; }
    .msg{ color: rgba(230,230,240,.85); font-size: .92rem; line-height: 1.3; }
    .hint{ margin-top: 8px; font-size: .78rem; color: rgba(160,165,180,.75); }

    .toast[data-kind="success"]{ border-color: rgba(90, 220, 160, .35); }
    .toast[data-kind="warning"]{ border-color: rgba(255, 216, 107, .35); }
    .toast[data-kind="error"]{ border-color: rgba(255, 107, 107, .40); }
    .toast[data-kind="info"]{ border-color: rgba(90, 140, 255, .35); }
  `],
})
export class ToastsComponent {
  private store = inject(ToastStore);
  items = computed(() => this.store.items());
  remove(id: string) { this.store.remove(id); }
}
